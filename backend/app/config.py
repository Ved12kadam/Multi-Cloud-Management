import os

class Config:
    """Base config class with shared configuration."""
    SECRET_KEY = os.urandom(24)  # Random secret key for sessions
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable modification tracking
  # SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:root@localhost:3306/multicloud')
    # You can change the database URI based on your environment (e.g., production, testing)
