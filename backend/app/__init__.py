from datetime import timedelta
import os
import secrets
import uuid
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_session import Session
from sqlalchemy import create_engine, text
from flask_migrate import Migrate
from flask_mail import Mail
from flask_jwt_extended import JWTManager

# Configure logging with custom formatter
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')

class CustomFormatter(logging.Formatter):
    """Custom formatter to add symbols to log levels."""
    FORMATS = {
        logging.DEBUG:   "%(asctime)s - DEBUG - %(message)s",
        logging.INFO:    "%(asctime)s - INFO - ✅ %(message)s",
        logging.WARNING: "%(asctime)s - WARNING - ⚠️ %(message)s",
        logging.ERROR:   "%(asctime)s - ERROR - ❌ %(message)s",
        logging.CRITICAL: "%(asctime)s - CRITICAL - ❌ %(message)s"
    }
    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, self.FORMATS[logging.DEBUG])
        formatter = logging.Formatter(log_fmt, datefmt='%Y-%m-%d %H:%M:%S')
        return formatter.format(record)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
root_logger = logging.getLogger()
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    handler.setFormatter(CustomFormatter())
    logger.addHandler(handler)
else:
    for handler in root_logger.handlers:
        handler.setFormatter(CustomFormatter())

# Initialize extensions
db = SQLAlchemy(engine_options={"pool_size": 50, "max_overflow": 50})
db.session.expire_on_commit = False
bcrypt = Bcrypt()
sess = Session()

mail = Mail()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000", "https://localhost:3000"])

    app.debug = True  # Ensure debug mode is enabled
    app.config['DEBUG'] = True # Explicitly set DEBUG config
    app.config['PROPAGATE_EXCEPTIONS'] = True # CRUCIAL for getting full tracebacks in logs

    app_id = uuid.uuid4()
    logger.info(f"Creating app with ID: {app_id}")

    # Database configuration
    DB_URI = "mysql+pymysql://root:root@localhost:3306/multicloud"
    app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Secret Key configuration
    secret_key = os.environ.get("SECRET_KEY") or secrets.token_urlsafe(32)
    if not os.environ.get("SECRET_KEY"):
        logger.warning("Generated a random SECRET_KEY. Set it in your environment for production.")
    app.config['SECRET_KEY'] = secret_key

    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))

    # Session configuration
    app.config.update(
        SESSION_TYPE='sqlalchemy',
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=timedelta(days=1),
        SESSION_USE_SIGNER=True,
        SESSION_SQLALCHEMY=db,
        SESSION_SQLALCHEMY_TABLE='sessions',
        SESSION_COOKIE_NAME='your_session_cookie_name',
        SESSION_COOKIE_SAMESITE='None',
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_PATH='/'
    )

    # Mail Configuration
    app.config.update(
        MAIL_SERVER="smtp.gmail.com",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_DEFAULT_SENDER=os.getenv("MAIL_DEFAULT_SENDER", "multicloudproject0@gmail.com")
    )

    # Initialize Flask extensions
    db.init_app(app)
    app.db = db
    bcrypt.init_app(app)
    app.config['bcrypt'] = bcrypt
    sess.init_app(app)
    Migrate(app, db)

    # Mail configuration
    mail.init_app(app)
    jwt.init_app(app)
    db.init_app(app)

    # Test database connection
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1")).scalar()
            logger.info("✅ Database connection successful")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")

    # Register Blueprints
    from app.signin import signin_blueprint
    app.register_blueprint(signin_blueprint)
    from app.signup import signup_blueprint
    app.register_blueprint(signup_blueprint)
    from app.cloudprovider import google_bp, dropbox_bp
    app.register_blueprint(google_bp)
    app.register_blueprint(dropbox_bp)
    from app.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp)
    from app.filemanager import file_manager_bp
    app.register_blueprint(file_manager_bp)
    from app.transfer import transfer_bp
    app.register_blueprint(transfer_bp)
    from app.signout import signout_bp
    app.register_blueprint(signout_bp)
    from app.linkedaccounts import linkedaccount_bp  # Corrected import: linkedaccounts_bp (plural)
    app.register_blueprint(linkedaccount_bp)
    
    from app.password_reset import password_reset_blueprint
    app.register_blueprint(password_reset_blueprint)

    logger.info("🚀 App created successfully")
    print(f"App created with ID: {app_id}")
    return app

if __name__ == '__main__':
    app = create_app()
    if os.environ.get("FLASK_ENV", "development") == "development":
        logger.warning("Running in development mode without SSL")
        app.run(debug=True)
    else:
        ssl_cert = "certificate.pem"
        ssl_key = "private_key.pem"
        if os.path.exists(ssl_cert) and os.path.exists(ssl_key):
            logger.info("Running with SSL")
            app.run(debug=False, ssl_context=(ssl_cert, ssl_key))
        else:
            logger.error("SSL certificates not found! Running without HTTPS.")
            app.run(debug=False)