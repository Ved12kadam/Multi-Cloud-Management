from flask import Blueprint, jsonify, session, request, send_file
import os
import logging
import io
from werkzeug.utils import secure_filename
from .cloudprovider import (
    get_google_drive_service,
    get_google_drive_files,
    upload_to_google_drive,
    download_from_google_drive,
    delete_from_google_drive,
    create_google_drive_folder,
    get_dropbox_service,
    get_dropbox_files,
    upload_to_dropbox,
    download_from_dropbox,
    delete_from_dropbox,
    create_dropbox_folder
)
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload

file_manager_bp = Blueprint('file_manager_bp', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'mp4', 'mp3', 'avi', 'mov', 'json', 'csv'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
logging.basicConfig(level=logging.INFO)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@file_manager_bp.route('/files/<provider>/<account_id>', methods=['GET'])
def get_files(provider, account_id):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401
        
        folder_id = request.args.get('folder', '')

        if provider == 'GoogleDrive':
            service = get_google_drive_service(user_id, account_id)
            if not service:
                return jsonify({"error": "Google Drive service not available"}), 400
            files = get_google_drive_files(service, folder_id)
        elif provider == 'Dropbox':
            service = get_dropbox_service(user_id, account_id)
            if not service:
                return jsonify({"error": "Dropbox service not available"}), 400
            files = get_dropbox_files(service, folder_id)
        else:
            return jsonify({"error": "Invalid provider"}), 400
        
        return jsonify(files)
    except Exception as e:
        logging.error(f"Error retrieving files: {e}")
        return jsonify({"error": str(e)}), 500

@file_manager_bp.route('/upload/<provider>/<account_id>', methods=['POST'])
def upload_file(provider, account_id):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        parent_folder_id = request.form.get('parent_folder_id')

        if provider == 'GoogleDrive':
            file_id = upload_to_google_drive(
                user_id,
                account_id,
                file.stream,
                secure_filename(file.filename),
                file.content_type,
                parent_folder_id
            )
        elif provider == 'Dropbox':
            file_id = upload_to_dropbox(user_id, account_id, file.stream, secure_filename(file.filename), parent_folder_id)
        else:
            return jsonify({"error": "Invalid provider"}), 400

        if file_id:
            return jsonify({"message": "File uploaded successfully", "file_id": file_id})
        else:
            return jsonify({"error": "File upload failed"}), 500
    except Exception as e:
        logging.error(f"Error uploading file: {e}")
        return jsonify({"error": str(e)}), 500

@file_manager_bp.route('/download/<provider>/<account_id>/<file_id>', methods=['GET'])
def download_file(provider, account_id, file_id):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        parent_folder_id = request.args.get('parent_folder_id')

        if provider == 'GoogleDrive':
            file_stream = download_from_google_drive(user_id, file_id,account_id) 
        elif provider == 'Dropbox':
            file_stream = download_from_dropbox(user_id, account_id, file_id, parent_folder_id)  # ✅ Keep account_id for Dropbox
        else:
            return jsonify({"error": "Invalid provider"}), 400

        if file_stream:
            return send_file(file_stream, as_attachment=True, download_name="downloaded_file")
        else:
            return jsonify({"error": "File download failed"}), 500

    except Exception as e:
        logging.error(f"Error downloading file: {e}")
        return jsonify({"error": str(e)}), 500


@file_manager_bp.route('/delete/<provider>/<account_id>/<file_id>/<file_name>', methods=['DELETE'])
def delete_file(provider, account_id, file_id, file_name):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        parent_folder_id = request.args.get('parent_folder_id')

        if provider == 'GoogleDrive':
            success = delete_from_google_drive(user_id, account_id, file_name)
        elif provider == 'Dropbox':
            success = delete_from_dropbox(user_id, account_id, file_id, parent_folder_id)
        else:
            return jsonify({"error": "Invalid provider"}), 400

        if success:
            return jsonify({"message": "File deleted successfully", "file_name": file_name})
        else:
            return jsonify({"error": "File deletion failed"}), 500
    except Exception as e:
        logging.error(f"Error deleting file: {e}")
        return jsonify({"error": str(e)}), 500

@file_manager_bp.route('/create-folder/<provider>/<account_id>', methods=['POST'])
def create_folder(provider, account_id):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        data = request.get_json()
        parent_folder_id = data.get('parent_folder_id', "")
        folder_name = data.get('folder_name', "NewFolder")

        if provider == 'GoogleDrive':
            folder_info = create_google_drive_folder(user_id, account_id, folder_name, parent_folder_id)
        elif provider == 'Dropbox':
            folder_info = create_dropbox_folder(user_id, account_id, folder_name, parent_folder_id)  # ✅ Fixed Order
        else:
            return jsonify({"error": "Invalid provider"}), 400

        if "error" in folder_info:
            return jsonify(folder_info), 500

        return jsonify({
            "message": "Folder created successfully",
            "folder_info": folder_info
        })
    except Exception as e:
        logging.error(f"Error creating folder: {e}")
        return jsonify({"error": str(e)}), 500
