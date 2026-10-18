from flask import Blueprint, jsonify, session,request
from .models import GoogleDriveAccount, DropboxAccount ,User # Import models
from . import db
import logging
from sqlalchemy.exc import SQLAlchemyError

linkedaccount_bp = Blueprint('linkedaccount_bp', __name__)

@linkedaccount_bp.route('/linked-accounts', methods=['GET'])
def get_linked_accounts():
    """Retrieve linked accounts for the logged-in user."""
    try:
        user_id = session.get('user_id')
        provider = request.args.get('provider')
        
        
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        logging.info(f"Fetching linked accounts for user_id: {user_id}, provider: {provider}")

        google_accounts = GoogleDriveAccount.query.filter_by(user_id=user_id).all()
        dropbox_accounts = DropboxAccount.query.filter_by(user_id=user_id).all()

        linked_accounts = []
        if provider == "GoogleDrive":
            linked_accounts = [
                {"id": acc.id, "provider": "GoogleDrive", "email": acc.email, "profile_picture": acc.profile_picture}
                for acc in google_accounts
            ]
        elif provider == "Dropbox":
            linked_accounts = [
                {"id": acc.id, "provider": "Dropbox", "email": acc.email, "profile_picture": acc.profile_picture}
                for acc in dropbox_accounts
            ]
        else:
            linked_accounts = [
                {"id": acc.id, "provider": "GoogleDrive", "email": acc.email, "profile_picture": acc.profile_picture}
                for acc in google_accounts
            ] + [
                {"id": acc.id, "provider": "Dropbox", "email": acc.email, "profile_picture": acc.profile_picture}
                for acc in dropbox_accounts
            ]
            
        logging.info(f"Linked accounts fetched successfully: {linked_accounts}")

        return jsonify(linked_accounts)
    
    except Exception as e:
        logging.error(f"Error fetching linked accounts: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

@linkedaccount_bp.route('/unlink-account', methods=['POST'])
def unlink_account():
    try:
        data = request.get_json()
        service_type = data.get('service_type')
        account_id = data.get('account_id')  # Get specific account ID
        user_id = session.get('user_id')

        logging.info(f"Unlink request: user_id={user_id}, service_type={service_type}, account_id={account_id}")

        if not user_id:
            return jsonify({'message': 'User not logged in'}), 401
        if not account_id:
            return jsonify({'message': 'Account ID is required'}), 400

        cursor = db.engine.connect()  # Establish connection

        if service_type == 'Dropbox':
            cursor.execute(f"DELETE FROM DropboxAccount WHERE user_id = {user_id} AND id = {account_id}")
            logging.info(f"Dropbox account {account_id} deleted using direct SQL")
        elif service_type == 'GoogleDrive':
            cursor.execute(f"DELETE FROM google_drive_account WHERE user_id = {user_id} AND id = {account_id}")
            logging.info(f"Google Drive account {account_id} deleted using direct SQL")
        else:
            cursor.close()  # Close the connection if service_type is invalid
            return jsonify({'message': 'Invalid service type'}), 400

        cursor.close()  # Close the connection after the delete
        db.session.commit()
        return jsonify({'message': 'Account unlinked successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logging.error(f'Error unlinking account: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
