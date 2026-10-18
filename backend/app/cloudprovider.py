import mimetypes
import os
import logging
import json
import dropbox
from datetime import datetime, timezone, timedelta  # Corrected import
from flask import Blueprint, jsonify, session, request, redirect, url_for
import requests
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request  # Corrected import
from requests_oauthlib import OAuth2Session
from sqlalchemy.exc import SQLAlchemyError
from app import db
from app.models import User, GoogleDriveAccount, DropboxAccount
from urllib.parse import urljoin
from googleapiclient.discovery import build  # Corrected import
from google.oauth2 import credentials  # Corrected import
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import io
from werkzeug.utils import secure_filename
from googleapiclient.errors import HttpError
from dropbox.exceptions import ApiError


# Configure logging
logging.basicConfig(level=logging.INFO)

# Blueprints
google_bp = Blueprint('google_bp', __name__)
dropbox_bp = Blueprint('dropbox_bp', __name__)

# Google OAuth Configuration
CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive"
]

# Dropbox OAuth Configuration
DROPBOX_CLIENT_ID = "2mmizt7a837nzgd"
DROPBOX_CLIENT_SECRET = "rk47km871xdextz"
DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize"
DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token"
DROPBOX_LIST_URL = "https://api.dropboxapi.com/2/files/list_folder"
DROPBOX_REDIRECT_URI = "https://localhost:5000/dropbox/callback"



CLIENT_SECRETS_FILE = "credentials.json"

try:
    with open(CLIENT_SECRETS_FILE, 'r') as f:
        credentialsdata = json.load(f).get("web", {})

    CLIENT_ID = credentialsdata.get("client_id")
    CLIENT_SECRET = credentialsdata.get("client_secret")
    TOKEN_URI = credentialsdata.get("token_uri")
    AUTH_URI = credentialsdata.get("auth_uri")

    if not all([CLIENT_ID, CLIENT_SECRET, TOKEN_URI, AUTH_URI]):
        raise ValueError("Missing required credentials in credentials.json")

    logging.info("✅ All credentials loaded successfully!")
except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
    logging.error(f"❌ ERROR: {e}")
    exit(1)  # Exit the app if credentials are missing


@google_bp.route('/google-drive')
def google_provider_login():
    try:
        with open(CLIENT_SECRETS_FILE, 'r') as f:
            json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f"Error loading credentials file: {e}")
        return jsonify({"error": "Credentials file error"}), 500

    GOOGLE_REDIRECT_URI = urljoin(request.base_url, url_for("google_bp.google_drive_callback"))
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(prompt='consent', access_type='offline')
    session['state'] = state
    return redirect(authorization_url)


@google_bp.route('/google-drive-callback', endpoint='google_drive_callback')
def google_callback_provider():
    try:
        with open(CLIENT_SECRETS_FILE, 'r') as f:
            json.load(f)  # Validate the JSON file
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f"Error loading credentials file: {e}")
        return jsonify({"error": "Credentials file error"}), 500

    GOOGLE_REDIRECT_URI = urljoin(request.base_url, url_for("google_bp.google_drive_callback"))

    try:
        if 'state' not in session or session.pop('state') != request.args.get('state'):
            return jsonify({"error": "Invalid state parameter"}), 400

        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, state=request.args.get('state'))
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials

        # Get user info
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {credentials.token}'}
        )
        userinfo_response.raise_for_status()
        id_info = userinfo_response.json()

        email = id_info.get('email')
        picture = id_info.get('picture')  # Get the profile picture URL
        session['google_drive_email'] = email
        if not email:
            return jsonify({"error": "Email not found"}), 400

        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        account = GoogleDriveAccount.query.filter_by(user_id=user_id, email=email).first()
        if account:
            account.refresh_token = credentials.refresh_token
            if account.profile_picture == picture:  # Update if picture changed
                account.profile_picture = picture
        else:
            account = GoogleDriveAccount(
                user_id=user_id,
                email=email,
                date_linked=datetime.now().date(),
                refresh_token=credentials.refresh_token,
                profile_picture=picture  # Store the picture URL
            )
            db.session.add(account)
        logging.info(f"account: {account}")
        db.session.commit()
        return redirect(os.environ.get("FRONTEND_URL", "https://localhost:3000/mainpage/dashboard"))

    except Exception as e:
        db.session.rollback()
        logging.exception("Error in google_callback_provider: %s", str(e))
        return jsonify({"error": "An error occurred during authentication"}), 500
    
    
def get_google_drive_service(user_id, account_id):
    account = GoogleDriveAccount.query.filter_by(user_id=user_id, id=account_id).first()  # Filter by account_id
    if not account:
        return None

    creds = credentials.Credentials(
        token=account.access_token,
        refresh_token=account.refresh_token,
        token_uri=TOKEN_URI,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )

    if creds.expired:
        request = Request()
        try:
            creds.refresh(request)
            new_expiry = datetime.now(timezone.utc) + timedelta(seconds=3600)

            logging.info(f"✅ Google Drive token refreshed successfully! New expiry: {new_expiry}")

            account.access_token = creds.token
            account.access_token_expiry = new_expiry
            db.session.commit()

            updated_account = GoogleDriveAccount.query.get(account.id)  # Verification
            logging.info(f"✅ Updated expiry in DB: {updated_account.access_token_expiry}")

        except Exception as e:
            logging.error(f"❌ Error refreshing Google Drive token: {e}")
            return None  # Or raise the exception if you prefer

    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        logging.error(f"Error building Drive service: {e}")
        return None

def get_category(mime_type):
    if not mime_type:
        return "Other"

    if mime_type.startswith("image/"):
        return "Image"
    elif mime_type.startswith("video/"):
        return "Video"
    elif mime_type.startswith("audio/"):
        return "Audio"
    elif mime_type.startswith("text/"):
        return "Text"
    elif mime_type == "application/pdf" or \
            mime_type == "application/msword" or \
            mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or \
            mime_type == "application/vnd.google-apps.document" or \
            mime_type == "application/vnd.google-apps.spreadsheet" or \
            mime_type == "application/vnd.google-apps.presentation" or \
            mime_type == "application/json" or \
            mime_type == "application/csv" or \
            mime_type.startswith("application/vnd.openxmlformats-officedocument"):
        return "Document"
    elif mime_type == "application/zip" or \
            mime_type == "application/x-msdos-program" or \
            mime_type.startswith("application/octet-stream"):
        return "File"
    elif mime_type.startswith("application/vnd.google-apps.folder"):
        return "Folder"
    return "Other"

def get_google_drive_files(service, folder_id=None):
    """Retrieve all files and folders from Google Drive."""
    try:
        query = f"'{folder_id}' in parents" if folder_id else "'root' in parents"
        logging.info(f"Google Drive query: {query}")  # Log the query

        all_files_data = []
        next_page_token = None

        while True:
            try:
                results = service.files().list(
                    q=query,
                    pageSize=1000,
                    fields="nextPageToken, files(id, name, size, mimeType, modifiedTime)",
                    pageToken=next_page_token
                ).execute()
            except HttpError as e:
                logging.error(f"❌ Google Drive API error: {e}")
                raise

            files = results.get('files', [])

            if not files:
                logging.warning(f"⚠️ No files or folders found in folder ID: {folder_id or 'root'}")
                break

            for item in files:
                modified_time_str = item.get('modifiedTime')
                modified_time = None
                if modified_time_str:
                    try:
                        modified_time = datetime.fromisoformat(modified_time_str.replace('Z', '+00:00'))
                    except ValueError as e:
                        logging.error(f"❌ Error parsing modifiedTime: {e} for item: {item.get('name')}")

                is_folder = item.get('mimeType') == 'application/vnd.google-apps.folder'

                file_data = {
                    "id": item.get('id'),
                    "name": item.get('name'),
                    "size": item.get('size', '-') if not is_folder else "-",
                    "type": "folder" if is_folder else item.get('mimeType', 'application/octet-stream'), #added default mime type.
                    "mimeType": item.get('mimeType', 'application/octet-stream'), #added secondary mime type key.
                    "modified": modified_time.isoformat() if modified_time else '-',
                    "isFolder": is_folder
                }
                all_files_data.append(file_data)

            next_page_token = results.get('nextPageToken')
            if not next_page_token:
                break

        return all_files_data

    except Exception as e:
        logging.error(f"❌ Error fetching Google Drive files and folders: {e}")
        raise

    
import io
import logging
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload

logging.basicConfig(level=logging.INFO)


# Function to upload a file to Google Drive
def upload_to_google_drive(user_id, account_id, file_stream, filename, mimetype, parent_folder_id=None):
    service = get_google_drive_service(user_id, account_id)  # Ensure correct account_id is used
    
    logging.info(f"DEBUG: Uploading file '{filename}' with mimetype '{mimetype}'")

    # Validate `file_stream`
    if isinstance(file_stream, str):
        raise ValueError("ERROR: file_stream is a string! Expected BytesIO object.")

    if isinstance(file_stream, bytes):
        file_stream = io.BytesIO(file_stream)  # Convert raw bytes to BytesIO

    # Ensure the file stream is at the beginning
    file_stream.seek(0)

    if not service:
        logging.error("Google Drive service not available")
        return None

    # Construct file metadata
    file_metadata = {'name': filename}
    if parent_folder_id:
        file_metadata['parents'] = [parent_folder_id]  # Set parent folder

    # Validate mimetype (fallback to 'application/octet-stream' if None)
    if not mimetype:
        logging.warning("⚠️ Mimetype is None. Using 'application/octet-stream'.")
        mimetype = 'application/octet-stream'

    # Create MediaIoBaseUpload object
    media = MediaIoBaseUpload(file_stream, mimetype=mimetype, resumable=True)

    # Upload the file
    try:
        uploaded_file = service.files().create(body=file_metadata, media_body=media).execute()
        logging.info(f"✅ File uploaded to Google Drive: {filename} (ID: {uploaded_file.get('id')})")
        return uploaded_file.get('id')
    except Exception as e:
        logging.error(f"❌ Error uploading file: {e}")
        return None



# Function to download a file from Google Drive
def download_from_google_drive(user_id, file_id,account_id):
    try:
        service = get_google_drive_service(user_id, account_id)
        if not service:
            logging.error("Google Drive service not available")
            return None

        request = service.files().get_media(fileId=file_id)
        file_stream = io.BytesIO()
        downloader = MediaIoBaseDownload(file_stream, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            logging.info(f"📥 Download progress: {int(status.progress() * 100)}%")

        file_stream.seek(0)
        logging.info(f"✅ File downloaded from Google Drive: {file_id}")
        return file_stream  # Returns the file content as BytesIO

    except Exception as e:
        logging.error(f"❌ Error downloading file from Google Drive: {e}")
        return None



# Function to delete a file from Google Drive
def delete_from_google_drive(user_id,account_id, file_name):
    try:
        service = get_google_drive_service(user_id,account_id)
        if not service:
            logging.error("Google Drive service not available")
            return False

        # Search for file ID by name
        query = f"name='{file_name}' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])

        if not files:
            logging.error(f"❌ File not found in Google Drive: {file_name}")
            return False  # Return False if file is not found

        file_id = files[0]['id']  # Get first matching file ID
        service.files().delete(fileId=file_id).execute()
        
        logging.info(f"✅ File deleted successfully from Google Drive: {file_name} (ID: {file_id})")
        return True

    except Exception as e:
        logging.error(f"❌ Error deleting file from Google Drive: {e}")
        return False
    
    
    
def create_google_drive_folder(user_id,account_id ,folder_name, parent_folder_id=None):
    """
    Creates a new folder in Google Drive under the specified parent folder.
    
    :param user_id: The user ID associated with the Google Drive account.
    :param folder_name: The name of the folder to be created.
    :param parent_folder_id: The ID of the parent folder (default: root).
    :return: Dictionary with folder details or an error message.
    """
    service = get_google_drive_service(user_id,account_id)
    if not service:
        return {"error": "Google Drive service could not be initialized."}

    try:
        # 🔹 Check if folder already exists
        query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        results = service.files().list(q=query, fields="files(id, name, parents)").execute()
        folders = results.get("files", [])

        if folders:
            existing_folder = folders[0]
            logging.info(f"✅ Folder '{folder_name}' already exists with ID: {existing_folder['id']}")
            return {
                "id": existing_folder["id"],
                "name": existing_folder["name"],
                "mimeType": "application/vnd.google-apps.folder",
                "parent": existing_folder.get("parents", [])[0] if existing_folder.get("parents") else "root"
            }

        # 🔹 If folder does not exist, create it
        folder_metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_folder_id] if parent_folder_id else []
        }

        folder = service.files().create(
            body=folder_metadata,
            fields="id, name, mimeType, parents"
        ).execute()

        logging.info(f"✅ Folder '{folder_name}' created successfully with ID: {folder['id']}")
        return {
            "id": folder["id"],
            "name": folder["name"],
            "mimeType": folder["mimeType"],
            "parent": parent_folder_id or "root"
        }

    except Exception as e:
        logging.error(f"❌ Error creating folder: {e}")
        return {"error": str(e)}


    
    



@dropbox_bp.route("/dropbox")
def dropbox_login():
    DROPBOX_REDIRECT_URI = urljoin(request.base_url, url_for("dropbox_bp.dropbox_callback"))
    dropbox = OAuth2Session(DROPBOX_CLIENT_ID, redirect_uri=DROPBOX_REDIRECT_URI)
    authorization_url, state = dropbox.authorization_url(DROPBOX_AUTH_URL, token_access_type="offline")
    session['dropbox_state'] = state
    return redirect(authorization_url)


@dropbox_bp.route("/dropbox/callback")
def dropbox_callback():
    """Handles Dropbox OAuth callback, exchanges code for token, and stores it in the database."""
    try:
        logging.info("🔄 Starting Dropbox OAuth callback process.")

        # Validate state parameter to prevent CSRF attacks
        if 'dropbox_state' not in session or session.pop('dropbox_state') != request.args.get('state'):
            return jsonify({"error": "Invalid state parameter"}), 400

        # 1️⃣ Extract the 'code' parameter from the request
        code = request.args.get("code")
        if not code:
            logging.error("❌ Authorization failed: No 'code' received.")
            return jsonify({"error": "Authorization failed: No code received."}), 400

        logging.info(f"✅ Received authorization code: {code}")

        # 2️⃣ Exchange the authorization code for an access token
        logging.info("🔄 Requesting Dropbox access token...")
        token_data = {
            "code": code,
            "grant_type": "authorization_code",
            "client_id": DROPBOX_CLIENT_ID,
            "client_secret": DROPBOX_CLIENT_SECRET,
            "redirect_uri": DROPBOX_REDIRECT_URI,
        }
        response = requests.post(DROPBOX_TOKEN_URL, data=token_data)

        if response.status_code != 200:
            logging.error(f"❌ Failed to retrieve Dropbox access token: {response.text}")
            return jsonify({"error": "Failed to retrieve Dropbox access token", "details": response.json()}), 500

        token = response.json()
        access_token = token.get("access_token")
        refresh_token = token.get("refresh_token")  # Not always provided

        logging.info(f"✅ Dropbox access token received successfully: {access_token[:10]}...")

        # 3️⃣ Fetch user account details from Dropbox
        logging.info("🔄 Fetching Dropbox account details...")
        account_info_response = requests.post(
            "https://api.dropboxapi.com/2/users/get_current_account",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if account_info_response.status_code != 200:
            logging.error(f"❌ Failed to fetch Dropbox account details: {account_info_response.text}")
            return jsonify({"error": "Failed to retrieve Dropbox account details"}), 500

        account_info = account_info_response.json()
        email = account_info.get("email")

        if not email:
            logging.error("❌ Email not found in Dropbox account response.")
            return jsonify({"error": "Email not found in Dropbox account data"}), 400

        logging.info(f"✅ Dropbox account verified for email: {email}")

        # 4️⃣ Retrieve the logged-in user
        user_id = session.get("user_id")
        if not user_id:
            logging.error("❌ User not logged in.")
            return jsonify({"error": "User not logged in"}), 401

        logging.info(f"✅ Logged-in user ID: {user_id}")

        # 5️⃣ Fetch and store profile picture URL
        logging.info("🔄 Fetching Dropbox profile picture URL...")
        profile_picture_url = account_info.get("profile_photo_url", "")
        logging.info(f"✅ Dropbox profile picture URL retrieved: {profile_picture_url}")

        session['dropbox_email'] = email  # Store email in session
        
        # 6️⃣ Store/update Dropbox account in database
        logging.info("🔄 Checking if Dropbox account already exists in DB...")
        account = DropboxAccount.query.filter_by(user_id=user_id, email=email).first()

        if not account:
            logging.info("🆕 Creating a new Dropbox account entry.")
            account = DropboxAccount(
                user_id=user_id,
                email=email,
                access_token=access_token,
                refresh_token=refresh_token,
                date_linked=datetime.now().date(),
                profile_picture=profile_picture_url if profile_picture_url else None  # Store if available
            )
            db.session.add(account)
        else:
            logging.info("🔄 Updating existing Dropbox account entry.")
            account.access_token = access_token
            account.refresh_token = refresh_token
            if profile_picture_url:
                account.profile_picture = profile_picture_url  # Update if available

        # Commit changes to the database
        db.session.commit()
        logging.info("✅ Dropbox account successfully saved to database.")

        # 7️⃣ Redirect to frontend dashboard after successful authentication
        return redirect(os.environ.get("FRONTEND_URL", "https://localhost:3000/mainpage/dashboard"))

    except Exception as e:
        logging.exception("❌ Error in dropbox_callback: %s", str(e))
        db.session.rollback()
        return jsonify({"error": "An error occurred during Dropbox authentication"}), 500


def is_token_expired(account):
    """Checks if the Dropbox access token is expired."""
    if not account.access_token_expiry:
        return True  # Assume expired if no expiry time is set

    # Ensure access_token_expiry is timezone-aware
    expiry_time = account.access_token_expiry
    if expiry_time.tzinfo is None:  # Convert naive datetime to UTC
        expiry_time = expiry_time.replace(tzinfo=timezone.utc)

    return expiry_time < datetime.now(timezone.utc)

def refresh_dropbox_token(refresh_token):
    """Refresh Dropbox access token using OAuth 2.0."""
    logging.info("🔄 Attempting to refresh Dropbox token...")

    url = "https://api.dropbox.com/oauth2/token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": DROPBOX_CLIENT_ID,
        "client_secret": DROPBOX_CLIENT_SECRET,
    }

    response = requests.post(url, data=data)
    if response.status_code == 200:
        new_token = response.json().get("access_token")
        logging.info(f"✅ Successfully refreshed Dropbox token: {new_token}")

        # Return the new token
        return new_token
    else:
        logging.error(f"❌ Failed to refresh Dropbox token: {response.json()}")
        return None

def get_dropbox_service(user_id, account_id):
    """Retrieves the Dropbox access token for a specific linked account."""
    account = DropboxAccount.query.filter_by(user_id=user_id, id=account_id).first()  # Filter by account_id
    if not account:
        logging.warning(f"⚠️ No Dropbox account found for user {user_id} with account ID {account_id}.")
        return None

    # Check if token is expired and refresh if necessary
    if is_token_expired(account):
        logging.info(f"🔄 Token expired for account {account_id}! Refreshing Dropbox token...")
        new_token = refresh_dropbox_token(account.refresh_token)

        if not new_token:
            logging.error(f"❌ Failed to refresh Dropbox token for account {account_id}.")
            return None
        
        # ✅ Save new token in the database
        account.access_token = new_token
        account.access_token_expiry = datetime.now(timezone.utc) + timedelta(hours=4)
        db.session.commit()

        logging.info(f"✅ New token saved in the database for account {account_id}.")

    # ✅ Return a dictionary instead of a Dropbox object
    return {"access_token": account.access_token}
 

def get_category(mime_type):
    """Categorizes Dropbox files based on MIME type."""
    if not mime_type:
        return "Other"

    if mime_type.startswith("image/"):
        return "Image"
    elif mime_type.startswith("video/"):
        return "Video"
    elif mime_type.startswith("audio/"):
        return "Audio"
    elif mime_type.startswith("text/"):
        return "Text"
    elif mime_type in ["application/pdf", "application/msword",
                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                       "application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet",
                       "application/vnd.google-apps.presentation", "application/json", "application/csv"] or \
         mime_type.startswith("application/vnd.openxmlformats-officedocument"):
        return "Document"
    elif mime_type in ["application/zip", "application/x-msdos-program"] or \
         mime_type.startswith("application/octet-stream"):
        return "File"
    elif mime_type == "application/vnd.google-apps.folder":
        return "Folder"
    
    return "Other"


def get_dropbox_files(service, folder_path=""):
    """Retrieve ALL files and folders from Dropbox with proper pagination."""
    try:
        all_files_data = []
        cursor = None

        # ✅ Ensure service is a dictionary before calling `.get()`
        if isinstance(service, dropbox.Dropbox):
            logging.error("❌ Expected a dictionary with access_token, but got a Dropbox object.")
            return []

        access_token = service.get("access_token") if isinstance(service, dict) else None
        if not access_token:
            logging.error("❌ Dropbox access token not found!")
            return []

        dbx = dropbox.Dropbox(access_token)  # ✅ Initialize Dropbox client
        logging.info("✅ Successfully authenticated with Dropbox API.")

        while True:
            if cursor:
                result = dbx.files_list_folder_continue(cursor)
            else:
                result = dbx.files_list_folder(folder_path, recursive=False, include_media_info=True)

            for item in result.entries:
                is_folder = isinstance(item, dropbox.files.FolderMetadata)
                modified_time = getattr(item, "server_modified", "-")  # ✅ Safer access
                size = getattr(item, "size", "-") if not is_folder else "-"

                # ✅ MIME type fix: Guess based on filename extension
                if is_folder:
                    file_type = "folder"
                else:
                    mime_type, _ = mimetypes.guess_type(item.name)
                    file_type = mime_type if mime_type else "application/octet-stream"

                logging.info(f"📁 {item.name} ({file_type}): {size} bytes, modified: {modified_time}")
                file_data = {
                    "id": item.id,
                    "name": item.name,
                    "size": size,
                    "type": file_type,
                    "mimeType": file_type,
                    "modified": modified_time,
                    "isFolder": is_folder
                }
                all_files_data.append(file_data)

            cursor = result.cursor
            if not result.has_more:
                break  # No more pages to fetch

        logging.info(f"✅ Retrieved {len(all_files_data)} files/folders from Dropbox.")
        return all_files_data  # Return all files and folders

    except dropbox.exceptions.AuthError as auth_error:
        logging.error(f"❌ Dropbox Authentication Error: {auth_error}")
        return []

    except dropbox.exceptions.ApiError as api_error:
        logging.error(f"❌ Dropbox API Error: {api_error}")
        return []

    except Exception as e:
        logging.error(f"❌ Unexpected Error fetching Dropbox files: {e}")
        return []

def get_dropbox_storage(service):
    """Retrieve Dropbox storage details"""
    try:
        access_token = service.get("access_token")  # ✅ Extract token from dictionary
        if not access_token:
            logging.error("❌ Dropbox access token missing!")
            return None

        dbx = dropbox.Dropbox(access_token)  # ✅ Create Dropbox object
        usage = dbx.users_get_space_usage()

        return {
            "name": "Dropbox",
            "used": round(usage.used / (1024**3), 2),  # Convert to GB
            "total": round(usage.allocation.get_individual().allocated / (1024**3), 2),
        }

    except dropbox.exceptions.AuthError as e:
        logging.error(f"❌ Dropbox Authentication Error: {e}")
        return None
    except Exception as e:
        logging.error(f"❌ Error fetching Dropbox storage: {e}")
        return None
    
    
def get_dropbox_access_token(user_id, account_id):
    """Retrieve the Dropbox access token for the given user and specific account."""
    account = DropboxAccount.query.filter_by(user_id=user_id, id=account_id).first()
    if not account:
        logging.warning(f"⚠️ No Dropbox account found for user {user_id} with account ID {account_id}.")
        return None

    # Check if token is expired and refresh if necessary
    if is_token_expired(account):
        logging.info(f"🔄 Token expired for account {account_id}! Refreshing Dropbox token...")
        new_token = refresh_dropbox_token(account.refresh_token)

        if not new_token:
            logging.error(f"❌ Failed to refresh Dropbox token for account {account_id}.")
            return None
        
        # ✅ Save new token in the database
        account.access_token = new_token
        account.access_token_expiry = datetime.now(timezone.utc) + timedelta(hours=4)
        db.session.commit()

        logging.info(f"✅ New token saved for account {account_id}.")

    return account.access_token

    
def get_dropbox_client(user_id, account_id):
    """Retrieve an authenticated Dropbox client for the given user and account ID."""
    token = get_dropbox_access_token(user_id, account_id)  # Ensure this function fetches the correct account's token
    
    if not token:
        logging.error(f"❌ Dropbox access token not found for user {user_id}, account {account_id}")
        return None

    try:
        return dropbox.Dropbox(token)
    except Exception as e:
        logging.error(f"❌ Error initializing Dropbox client: {e}")
        return None



# Function to upload a file to Dropbox
def upload_to_dropbox(user_id, account_id, file_stream, filename, parent_folder_id=None):
    try:
        dbx = get_dropbox_client(user_id, account_id)  # Ensure the correct Dropbox account is used
        if not dbx:
            logging.error("Dropbox client unavailable.")
            return None

        # Ensure file_stream is at the beginning
        file_stream.seek(0)

        # Construct Dropbox path: default to root ("/filename"), otherwise use parent folder
        dropbox_path = f"/{filename}" if not parent_folder_id else f"{parent_folder_id}/{filename}"

        logging.info(f"Uploading file to Dropbox path: {dropbox_path}")

        # Upload file
        dbx.files_upload(file_stream.read(), dropbox_path, mode=dropbox.files.WriteMode.overwrite)

        return {"message": "✅ File uploaded successfully!", "dropbox_path": dropbox_path}

    except Exception as e:
        logging.error(f"❌ Error uploading to Dropbox: {e}")
        return None

# Function to download a file from Dropbox
def download_from_dropbox(user_id,account_id ,file_id, folder_id=None):
    """
    Download a file from Dropbox as a BytesIO stream using file ID and optional folder ID.
    :param user_id: User's ID
    :param file_id: ID of the file in Dropbox
    :param folder_id: ID of the folder in Dropbox (optional)
    :return: BytesIO stream of the file content
    """
    try:
        dbx = get_dropbox_client(user_id,account_id)
        if not dbx:
            logging.error("Failed to get Dropbox client.")
            return None

        if folder_id:
            # Get the path of the folder from its ID
            folder_metadata = dbx.files_get_metadata(folder_id)
            folder_path = folder_metadata.path_display
            file_metadata = dbx.files_get_metadata(file_id)
            file_path = file_metadata.path_display
        else:
            file_path = file_id #if no folder id is given, the file_id is the full path.

        metadata, res = dbx.files_download(file_path)  # Download the file
        file_content = res.content  # Get the file content in bytes

        file_stream = io.BytesIO(file_content)  # Convert to BytesIO
        file_stream.seek(0)  # Ensure it's at the start

        return file_stream  # ✅ Return a file-like object

    except dropbox.exceptions.ApiError as api_error:
        logging.error(f"Error downloading file from Dropbox: {api_error}")
        return None
    except Exception as e:
        logging.error(f"Error downloading file from Dropbox: {e}")
        return None


# Function to delete a file from Dropbox
def delete_from_dropbox(user_id,account_id ,file_id, folder_id=None):
    """
    Delete a file from Dropbox using file ID and optional folder ID.
    :param user_id: User's ID
    :param file_id: ID of the file in Dropbox
    :param folder_id: ID of the folder in Dropbox (optional)
    :return: True if successful, False otherwise
    """
    try:
        dbx = get_dropbox_client(user_id,account_id)
        if not dbx:
            logging.error("Failed to get Dropbox client.")
            return False

        if folder_id:
            # Get the path of the folder from its ID
            folder_metadata = dbx.files_get_metadata(folder_id)
            folder_path = folder_metadata.path_display
            file_metadata = dbx.files_get_metadata(file_id)
            file_path = file_metadata.path_display
        else:
            file_path = file_id  # If no folder ID is given, the file_id is the full path.

        dbx.files_delete_v2(file_path)
        logging.info(f"File deleted from Dropbox: {file_path}")
        return True

    except dropbox.exceptions.ApiError as api_error:
        logging.error(f"Error deleting file from Dropbox: {api_error}")
        return False
    except Exception as e:
        logging.error(f"Error deleting file from Dropbox: {e}")
        return False
    
    
    
def create_dropbox_folder(user_id,account_id ,folder_name,parent_folder_id, ):
    try:
        dbx_data = get_dropbox_service(user_id,account_id)  # ✅ Fetch Dropbox service

        # Debug: Print what `dbx_data` contains
        print(f"DEBUG: get_dropbox_service returned: {dbx_data}")  
        logging.debug(f"DEBUG: get_dropbox_service returned: {dbx_data}")

        # 🔴 Check if dbx_data is a dictionary (contains 'access_token')
        if isinstance(dbx_data, dict) and "access_token" in dbx_data:
            dbx = dropbox.Dropbox(dbx_data["access_token"])  # ✅ Manually create Dropbox instance
        elif isinstance(dbx_data, dropbox.Dropbox):
            dbx = dbx_data  # ✅ Already a valid instance
        else:
            return {"error": f"Invalid Dropbox service instance: {type(dbx_data)}"}

        # Ensure correct folder path format
        parent_folder_path = "" if parent_folder_id == "" else f"/{parent_folder_id}"
        path = f"{parent_folder_path}/{folder_name}".replace("//", "/")  # ✅ Fix path

        dbx.files_create_folder_v2(path)

        return {"folder_path": path}

    except dropbox.exceptions.ApiError as api_error:
        logging.error(f"Dropbox API error: {api_error}")
        return {"error": str(api_error)}

    except Exception as e:
        logging.error(f"Dropbox folder creation error: {e}")
        return {"error": str(e)}
