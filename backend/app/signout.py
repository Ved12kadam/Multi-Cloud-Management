from flask import Flask, session, redirect, jsonify,Blueprint

app = Flask(__name__)

signout_bp = Blueprint('signout_bp', __name__)

@signout_bp.route('/signout')
def signout():
    session.clear()  # Clears session data
    return jsonify({"redirect": "/signin"})  # Send JSON response to frontend
