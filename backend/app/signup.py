from flask import Blueprint, request, jsonify, redirect, url_for

import os

from app import db, bcrypt
from app.models import User 


signup_blueprint = Blueprint('signup', __name__)

@signup_blueprint.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201
