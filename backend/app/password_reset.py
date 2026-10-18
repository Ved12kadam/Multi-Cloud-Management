from flask import Blueprint, request, jsonify
import secrets
import smtplib
import logging
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import db  # Assuming 'app' directory and 'db' object are correctly configured
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os  # Import os for environment variables
from app import bcrypt

password_reset_blueprint = Blueprint('password_reset', __name__)


@password_reset_blueprint.route("/forgotpassword", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")
    logging.info(f"Received password reset request for email: {email}")

    # Query user from database
    user = db.session.execute(
        "SELECT * FROM users WHERE email = :email", {"email": email}).fetchone()
    if not user:
        logging.warning(f"User with email {email} not found.")
        return jsonify({"error": "User not found"}), 404

    reset_token = secrets.token_hex(20)
    expiry = datetime.now() + timedelta(hours=1)
    logging.info(
        f"Generated reset token for {email}: {reset_token}, expires at {expiry}"
    )

    # Update the user with reset token and expiry
    db.session.execute(
        "UPDATE users SET reset_token = :token, reset_token_expiry = :expiry WHERE email = :email",
        {"token": reset_token, "expiry": expiry.isoformat(), "email": email})
    db.session.commit()

    # Send reset email using the configured SMTP server
    try:
        send_reset_email(email, reset_token)
        logging.info(f"Password reset email successfully sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send email to {email}: {str(e)}")
        return jsonify(
            {"error": "Failed to send reset email. Please try again later."}
        ), 500  # More user-friendly error

    return jsonify({"message": "Password reset email sent"}), 200


from datetime import datetime, timedelta  # Make sure these are imported at the top


@password_reset_blueprint.route("/resetpassword", methods=["POST"])
def reset_password():
    data = request.json
    new_password = data.get("newPassword")
    reset_token = data.get("resetToken")
    logging.info(
        f"✅ Received password reset request with token: {reset_token}")

    # Query user based on reset_token
    user = db.session.execute(
        "SELECT * FROM users WHERE reset_token = :token",
        {"token": reset_token}).fetchone()
    if not user:
        logging.warning("Invalid or expired reset token")
        return jsonify({"error": "Invalid or expired reset token"}), 400

    # Debugging - Print the type and value of reset_token_expiry
    logging.info(
        f"Type of user['reset_token_expiry']: {type(user['reset_token_expiry'])}"
    )
    logging.info(
        f"Value of user['reset_token_expiry']: {user['reset_token_expiry']}")

    expiry_datetime = user[
        "reset_token_expiry"]  # user["reset_token_expiry"] is already a datetime object

    # Check token expiry - Direct datetime comparison (no parsing)
    if expiry_datetime < datetime.now():
        logging.warning("Reset token expired")
        return jsonify({"error": "Invalid or expired reset token"}), 400

    hashed_password = bcrypt.generate_password_hash(new_password).decode(
        'utf-8')

    logging.info("Password successfully hashed")

    db.session.execute(
        "UPDATE users SET password = :password, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = :token",
        {"password": hashed_password, "token": reset_token})
    db.session.commit()
    logging.info("Password updated successfully")

    return jsonify({"message": "Password successfully reset"}), 200


def send_reset_email(user_email, reset_token):
    SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com"
                                 )  # Get from env vars, default to gmail
    SMTP_PORT = int(
        os.environ.get("SMTP_PORT", 587))  # Get from env vars, default to 587
    #sender_email = os.environ.get("SENDER_EMAIL") # Get from env vars, MUST be set
    #sender_password = os.environ.get("SENDER_PASSWORD") # Get from env vars, MUST be set
    sender_email = "multicloudproject0@gmail.com"  # HARDCODED SENDER EMAIL - REPLACE with YOUR EMAIL
    sender_password = "afhg kaql uxmg cwxc"  # HARDCODED SENDER PASSWORD - REPLACE with YOUR PASSWORD (APP PASSWORD if Gmail 2FA)
    DOMAIN = os.environ.get(
        "DOMAIN", "localhost:3000")  # For React App URL, default to localhost:3000

    if not sender_email or not sender_password:
        logging.error(
            "❌ Sender email or password not configured in environment variables."
        )
        raise Exception("Sender email or password not configured.")

    subject = "Password Reset Request"
    reset_link = f"https://{DOMAIN}/reset-password/{reset_token}"  # Use HTTPS and env variable for domain

    # Create email content
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = user_email
    message["Subject"] = subject

    # HTML content with inline CSS for styling
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body {{
          font-family: sans-serif;
          background-color: #f4f4f4;
          color: #333;
        }}
        .container {{
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }}
        h1 {{
          color: #007bff; /* Blue color for the heading */
        }}
        p {{
          line-height: 1.6;
        }}
        a {{
          color: #007bff;
          text-decoration: none;
        }}
        .button {{
          display: inline-block;
          padding: 10px 20px;
          background-color: #DC143C;
          color: #000000;
          border-radius: 5px;
          text-decoration: none;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Password Reset</h1>
        <p>Hi there,</p>
        <p>You have requested to reset your password. Please click the button below to reset your password:</p>
        <a href="{reset_link}" class="button">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
    """
    message.attach(MIMEText(html_content, "html"))

    try:
        logging.info("📨 Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        logging.info("🔒 TLS connection established.")

        server.login(sender_email, sender_password)
        logging.info(f"✅ Logged in as {sender_email}")

        server.sendmail(sender_email, user_email, message.as_string())
        logging.info(f"✅ Reset email sent to {user_email}")

        server.quit()
    except smtplib.SMTPAuthenticationError as e:
        logging.error(
            f"❌ SMTP Authentication Error! Check email & password: {e}")
        raise
    except smtplib.SMTPException as e:
        logging.error(f"❌ SMTP Error: {e}")
        raise
    except Exception as e:
        logging.error(f"❌ General Email Error: {e}")
        raise