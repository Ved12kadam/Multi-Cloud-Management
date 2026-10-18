import logging
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import CloudProviders, User

# Status Check Blueprint
status_bp = Blueprint('status_bp', __name__)

@status_bp.route("/sync-status", methods=["GET"])
@jwt_required()
def check_sync_status():
    try:
        # Get the logged-in user's email from the JWT token
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Fetch all linked cloud providers for the user
        linked_providers = CloudProviders.query.filter_by(user_id=user.id).all()

        if not linked_providers:
            return jsonify({"message": "No cloud accounts synced."}), 200

        # Format the response with provider details
        synced_accounts = []
        for provider in linked_providers:
            synced_accounts.append({
                "provider_name": provider.provider_name,
                "access_token": provider.access_token,
                "linked_at": provider.token_expiry.strftime("%Y-%m-%d %H:%M:%S")
            })

        return jsonify({"message": "Synced accounts retrieved successfully.", "synced_accounts": synced_accounts}), 200

    except Exception as e:
        logging.error(f"Error checking sync status: {str(e)}")
        return jsonify({"error": "Failed to fetch sync status"}), 500
