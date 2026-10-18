def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        # Explicitly setting the session
        session_id = session.sid
        print(session_id)
        user_session = UserSession(user_id=user.id, session_id=session_id)
        db.session.add(user_session)
        db.session.commit()
        