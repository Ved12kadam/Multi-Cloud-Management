from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(ssl_context=('certificate.pem', 'private_key.pem'), debug=True)  # Add use_reloader=False