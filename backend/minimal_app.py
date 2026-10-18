from flask import Flask, Blueprint, redirect, request, logging
import logging
import urllib.parse # Import urllib.parse for URL encoding

import logging # Correct import for logging
import os # Import os module

os.environ['SERVER_NAME'] = 'localhost:5000' # <---- ADD THIS LINE - SET SERVER_NAME
app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

dropbox_bp = Blueprint('dropbox_bp', __name__)

DROPBOX_CLIENT_ID = 'nuzezgzrvwywwxq' # <-- REPLACE WITH YOUR CLIENT ID
DROPBOX_OAUTH2_AUTHORIZE_URL = 'https://www.dropbox.com/oauth2/authorize'

@dropbox_bp.route('/dropbox-login')
def dropbox_login_minimal():
    # Explicitly construct redirect_uri string - HARDCODED for testing
    redirect_uri_str = "http://127.0.0.1:5000/dropbox-callback"

    # URL-encode the redirect_uri - FORCE encoding
    redirect_uri_encoded = urllib.parse.quote(redirect_uri_str) # URL-encode

    app.logger.debug(f"Generated redirect_uri (explicitly constructed, URL-encoded): {redirect_uri_encoded}") # Log encoded URI

    authorization_url = f"{DROPBOX_OAUTH2_AUTHORIZE_URL}?client_id={DROPBOX_CLIENT_ID}&response_type=code&redirect_uri={redirect_uri_encoded}"

    return redirect(authorization_url)


@dropbox_bp.route('/dropbox-callback')
def dropbox_callback_minimal():
    app.logger.debug("ENTERING dropbox_callback_minimal - MINIMAL APP TEST")
    return "Dropbox Callback Hit - Minimal App Test"

app.register_blueprint(dropbox_bp)

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    app.run(debug=True)