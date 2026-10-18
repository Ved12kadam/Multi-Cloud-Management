import os
import logging
import json
import dropbox
import requests
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request, session, g
from urllib.parse import urljoin
from google.oauth2 import credentials
from google.auth.transport.requests import Request
from app.models import GoogleDriveAccount, DropboxAccount, User
from app import db
from .cloudprovider import (
    get_google_drive_service, get_google_drive_files,
    get_dropbox_service, get_dropbox_files, get_dropbox_storage
)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Blueprints
dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/storage-data', methods=['GET'])
def get_storage_data():
    """Fetch storage usage for all linked cloud accounts."""
    try:
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        storage_data = []
        
        

        # ✅ Fetch all linked Google Drive accounts
        google_drive_accounts = GoogleDriveAccount.query.filter_by(user_id=user_id).all()
        for account in google_drive_accounts:
            
            try:
                service = get_google_drive_service(user_id, account.id)
                storage_info = get_google_drive_storage(service)
                storage_data.append({
                    "account_id": account.id,
                    "provider": "Google Drive",
                    "used": storage_info['used'],
                    "total": storage_info['total'],
                })
            except Exception as e:
                logging.error(f"❌ Error fetching Google Drive storage: {e}")

        # ✅ Fetch all linked Dropbox accounts
        dropbox_accounts = DropboxAccount.query.filter_by(user_id=user_id).all()
        for account in dropbox_accounts:
            try:
                service = get_dropbox_service(user_id, account.id)
                storage_info = get_dropbox_storage(service)
                storage_data.append({
                    "account_id": account.id,
                    "provider": "Dropbox",
                    "used": storage_info['used'],
                    "total": storage_info['total'],
                })
            except Exception as e:
                logging.error(f"❌ Error fetching Dropbox storage: {e}")

        return jsonify(storage_data)

    except Exception as e:
        logging.error(f"❌ Error in /storage-data: {e}")
        return jsonify({"error": "An error occurred"}), 500
    finally:
        db.session.remove()


@dashboard_bp.route('/file-data', methods=['GET'])
def get_file_data():
    """Fetch file details from all linked Google Drive & Dropbox accounts."""
    try:
        logging.info("➡️ /file-data route was hit!")
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        file_data = []

        # ✅ Fetch files from all linked Google Drive accounts
        google_drive_accounts = GoogleDriveAccount.query.filter_by(user_id=user_id).all()
        for account in google_drive_accounts:
            try:
                service = get_google_drive_service(user_id, account.id)
                if not service:
                    continue  # Skip if service is unavailable

                logging.info(f"Fetching Google Drive files for account {account.id}")
                files = get_google_drive_files(service)
                file_data.append({
                    "account_id": account.id,
                    "provider": "Google Drive",
                    "files": files
                })
            except Exception as e:
                logging.error(f"❌ Error fetching Google Drive files: {e}")

        # ✅ Fetch files from all linked Dropbox accounts
        dropbox_accounts = DropboxAccount.query.filter_by(user_id=user_id).all()
        for account in dropbox_accounts:
            try:
                service = get_dropbox_service(user_id, account.id)
                if not service:
                    continue  # Skip if service is unavailable

                logging.info(f"Fetching Dropbox files for account {account.id}")
                files = get_dropbox_files(service)
                file_data.append({
                    "account_id": account.id,
                    "provider": "Dropbox",
                    "files": files
                })
            except Exception as e:
                logging.error(f"❌ Error fetching Dropbox files: {e}")

        return jsonify(file_data)

    except Exception as e:
        logging.error(f"❌ Error in /file-data: {e}")
        return jsonify({"error": "An error occurred"}), 500
    finally:
        db.session.remove()


def get_google_drive_storage(service):
    """Retrieve Google Drive storage usage."""
    try:
        about = service.about().get(fields='storageQuota').execute()
        storage_info = about.get('storageQuota')

        return {
            "used": int(storage_info['usage']) / (1024**3),
            "total": int(storage_info['limit']) / (1024**3)
        }
    except Exception as e:
        logging.error(f"Error fetching Google Drive storage: {e}")
        raise
