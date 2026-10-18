import smtplib

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
sender_email = "multicloudproject0@gmail.com"
sender_password = "afhg kaql uxmg cwxc"  # Replace with your App Password if using Gmail with 2FA

try:
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(sender_email, sender_password)
    message = "Subject: Test Email\n\nThis is a test email."
    server.sendmail(sender_email, "your_test_recipient@example.com", message)
    server.quit()
    print("✅ SMTP Connection Successful: Email sent!")
except Exception as e:
    print(f"❌ SMTP Error: {e}")
