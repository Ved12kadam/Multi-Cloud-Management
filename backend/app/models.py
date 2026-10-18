from app import db
from sqlalchemy import Column, DateTime, Integer, String, Date, ForeignKey, LargeBinary, TIMESTAMP
from sqlalchemy.orm import relationship

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()



class GoogleDriveAccount(db.Model):
    __tablename__ = 'google_drive_account'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Add the foreign key here!
    email = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(255))
    profile_picture = db.Column(db.String(255))
    date_linked = db.Column(db.Date)
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    is_primary = db.Column(db.Boolean)
    access_token_expiry = db.Column(DateTime)

    def __repr__(self):
        return "<GoogleDriveAccount {}>".format(self.email)  # Use str.format()
    
class DropboxAccount(db.Model):
    __tablename__ = 'dropboxaccount'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    display_name = db.Column(db.String(120))
    profile_picture = db.Column(db.String(250))
    date_linked = db.Column(db.Date, nullable=False)
    access_token = db.Column(db.String(255))  # Added this field
    refresh_token = db.Column(db.String(255))  # Added this field
    access_token_expiry = db.Column(db.DateTime(), nullable=True)





class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    picture = db.Column(db.String(250), nullable=True)  # Add picture attribute
    reset_token = db.Column(db.String(255), nullable=True)  # Add reset_token column
    reset_token_expiry = db.Column(db.DateTime, nullable=True) # Add reset_token_expiry column
    # Relationships
    google_drive_accounts = db.relationship('GoogleDriveAccount', backref='users', lazy=True)
    dropbox_accounts = db.relationship('DropboxAccount', backref='users', lazy=True)

    # ... other model code



class Session(db.Model):
    __tablename__ = 'sessions'
    __table_args__ = {'extend_existing': True, 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_unicode_ci'}
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), nullable=False)
    data = Column(LargeBinary, nullable=False)
    expiry = Column(TIMESTAMP)
