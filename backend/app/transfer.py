from flask import Blueprint, request, jsonify, session
from .cloudprovider import (
    get_google_drive_service, get_dropbox_service,
    get_google_drive_files, get_dropbox_files,
    create_dropbox_folder, create_google_drive_folder,
    download_from_google_drive, upload_to_google_drive,
    download_from_dropbox, upload_to_dropbox
)
import io
import logging

transfer_bp = Blueprint('transfer', __name__)
@transfer_bp.route('/list-files', methods=['GET'])
def list_files():
    """Fetch files from the selected cloud provider."""
    try:
        provider = request.args.get('provider')
        account_id = request.args.get('account_id')
        user_id = session.get('user_id')
        logging.info(f"Fetching files for provider: {provider}, account ID: {account_id}, user_id : {user_id}")

        if not provider or not account_id:
            return jsonify({"error": "Provider or account ID not specified"}), 400
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401
        
        folder_id = request.args.get('folder', '')

        if provider == "GoogleDrive":
            service = get_google_drive_service(user_id, account_id)
            if not service:
                return jsonify({"error": "Google Drive service not available"}), 500
            files = get_google_drive_files(service, folder_id)
        elif provider == "Dropbox":
            service = get_dropbox_service(user_id, account_id)
            if not service:
                return jsonify({"error": "Dropbox service not available"}), 500
            files = get_dropbox_files(service, folder_id)
        else:
            return jsonify({"error": "Invalid provider"}), 400

        return jsonify(files)

    except Exception as e:
        logging.error(f"Error fetching files: {e}")
        return jsonify({"error": str(e)}), 500


@transfer_bp.route('/transfer-file', methods=['POST'])
def transfer_file():
    """Handles file transfer between cloud storage providers."""
    file_content = None
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        data = request.json
        source_provider = data.get('from_provider')
        destination_provider = data.get('to_provider')
        source_account_id = data.get('from_account_id')
        destination_account_id = data.get('to_account_id')
        file_id = data.get('file_id')
        file_name = data.get('file_name')
        destination_folder = data.get('destination_folder', '')
        logging.info(f"source_provider: {source_provider}, destination_provider: {destination_provider}, source_account_id: {source_account_id}, destination_account_id: {destination_account_id}, file_id: {file_id}, file_name: {file_name}, destination_folder: {destination_folder}")

        if not all([source_provider, destination_provider, source_account_id, destination_account_id, file_id, file_name]):
            return jsonify({"error": "Missing required parameters"}), 400

        if source_provider == "GoogleDrive":
            logging.info("Downloading file from Google Drive")
            file_content = download_from_google_drive(user_id, file_id,source_account_id)
        elif source_provider == "Dropbox":
            file_content = download_from_dropbox(user_id, source_account_id, file_id)
        else:
            return jsonify({"error": "Unsupported source provider"}), 400

        if file_content is None:
            return jsonify({"error": "Failed to download file from source"}), 500

        if isinstance(file_content, bytes):
            file_content = io.BytesIO(file_content)
        file_content.seek(0)

        mimetype = data.get('mimetype')
        success = False
        if destination_provider == "GoogleDrive":
            logging.info("Uploading file to Google Drive")
            success = upload_to_google_drive(user_id, destination_account_id, file_content, file_name, mimetype, destination_folder)
        elif destination_provider == "Dropbox":
            success = upload_to_dropbox(user_id, destination_account_id, file_content, file_name, destination_folder)
        else:
            return jsonify({"error": "Unsupported destination provider"}), 400

        if success:
            return jsonify({"message": "File transferred successfully"})
        else:
            return jsonify({"error": "Failed to upload file to destination"}), 500

    except Exception as e:
        logging.error(f"Error transferring file: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if file_content and hasattr(file_content, 'close'):
            file_content.close()

@transfer_bp.route('/create-folder', methods=['POST'])
def create_folder():
    """Creates a new folder in the specified cloud provider."""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        data = request.get_json()
        provider = data.get('provider')
        account_id = data.get('accountId')
        parent_folder_id = data.get('parent_folder_id', "")
        folder_name = data.get('folder_name', "NewFolder")

        if not provider or not account_id:
            return jsonify({"error": "Missing provider or account ID"}), 400

        if provider == 'Google Drive':
            folder_info = create_google_drive_folder(user_id, account_id, folder_name, parent_folder_id)
        elif provider == 'Dropbox':
            folder_info = create_dropbox_folder(user_id, account_id, parent_folder_id, folder_name)
        else:
            return jsonify({"error": "Invalid provider"}), 400

        if "error" in folder_info:
            return jsonify(folder_info), 500

        return jsonify({
            "success": True,
            "message": "Folder created successfully",
            "folder_info": folder_info
        })

    except Exception as e:
        logging.error(f"Error creating folder: {e}")
        return jsonify({"error": str(e)}), 500
