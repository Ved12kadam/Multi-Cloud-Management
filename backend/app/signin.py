from flask import Blueprint, request, jsonify, session, redirect, url_for, current_app
import requests
from oauthlib.oauth2 import WebApplicationClient
from app.models import User  # Import your User model
import logging
from sqlalchemy.exc import SQLAlchemyError
from app import db  # ✅ Import db from app
from flask_bcrypt import Bcrypt # Keep this import

# Google OAuth credentials
GOOGLE_CLIENT_ID="keys" # Replace with your actual client ID
GOOGLE_CLIENT_SECRET ="keys" # Replace with your actual client secret
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
client = WebApplicationClient(GOOGLE_CLIENT_ID)

signin_blueprint = Blueprint('signin_blueprint', __name__)

@signin_blueprint.route('/signin', methods=['POST'])
def signin():
    # db_session = current_app.config['Session']() # ❌ Removed manual session creation
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first() # ✅ Use User.query (implicitly uses db.session)
        logging.debug(f"Current app config: {current_app.config}") # ADD THIS LINE
        if user and current_app.config['bcrypt'].check_password_hash(user.password, password):
            session['user_id'] = user.id
            logging.info("User logged in with email/password. Session: %s", dict(session))
            return jsonify({"message": "Login successful"}), 200
        else:
            logging.error("Invalid email or password")
            return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        db.session.rollback()
        logging.error(f"General Error in signin: {e}", exc_info=True) # Log traceback for other errors
        return jsonify({"error": "An unexpected error occurred"}), 500

@signin_blueprint.route('/google-login')
def google_login():
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=url_for('signin_blueprint.google_callback_signin', _external=True),
        scope=["openid", "email", "profile"],
        prompt="consent"
    )
    return redirect(request_uri)

@signin_blueprint.route('/google-callback')
def google_callback_signin():
    # db_session = current_app.config['Session']()  # ❌ Removed manual session creation

    try:
        code = request.args.get('code')
        logging.info("Signin: Authorization code received: %s", code)

        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
        token_endpoint = google_provider_cfg["token_endpoint"]

        token_url, headers, body = client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=url_for('signin_blueprint.google_callback_signin', _external=True),
            code=code
        )

        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        )
        client.parse_request_body_response(token_response.text)
        logging.info("Signin: Token response: %s", token_response.text)

        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)

        userinfo = userinfo_response.json()
        logging.info("Signin: Userinfo response: %s", userinfo)

        email = userinfo["email"]

        user = User.query.filter_by(email=email).first() # ✅ Use User.query
        if not user:
            user = User(email=email, password="")  # No password for Google users
            db.session.add(user) # ✅ Use db.session.add()
            try:
                with db.session.begin(): # using context manager. Not strictly needed with Flask-SQLAlchemy, but good practice
                    db.session.commit() # ✅ Use db.session.commit()
                logging.info("Signin: New user created: %s", user)
            except SQLAlchemyError as e:
                db.session.rollback() # ✅ Use db.session.rollback()
                logging.error(f"Error committing user to DB: {e}")
                return jsonify({"error": "Error creating user"}), 500

        session['user_id'] = user.id
        logging.info("Signin: User logged in with Google. Session: %s", dict(session))
        return redirect('https://localhost:3000/mainpage')

    except Exception as e:
        logging.error(f"Error in google_callback_signin: {e}")
        return jsonify({"error": "An error occurred during Google signin"}), 500
    # finally: # ❌ Removed finally block with db_session.close()
    #     db_session.close()