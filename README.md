# Multi-Cloud Storage Management System

A web-based application designed to help users manage files across multiple cloud storage providers through one unified interface. The project aims to simplify cloud account management, file browsing, and file transfers between connected services.

## Overview

Users commonly store files across different platforms, such as Google Drive, Dropbox, and OneDrive. Switching between services to locate or transfer files can be inconvenient. The Multi-Cloud Storage Management System provides a centralized interface to connect supported cloud accounts and manage files more efficiently.

The project report describes a React.js frontend, a Python backend, and a MySQL database. Cloud-provider integrations use authentication tokens and should protect credentials and file-transfer operations.

## Objectives

- Provide a single interface for managing multiple cloud storage accounts.
- Allow users to connect and view supported cloud accounts.
- Display files available from connected providers.
- Support file transfers between supported cloud services.
- Store user, cloud-account, and file-metadata information in a database.
- Improve usability and protect account access through secure authentication.

## Main Features

- **Unified dashboard:** Access connected cloud services from one interface.
- **Cloud account management:** Connect and view supported cloud accounts.
- **File listing:** Browse files available through connected providers.
- **Cross-cloud transfer:** Transfer files between supported providers where integration and permissions allow.
- **Authentication:** Use the cloud providers' supported authorization flow and token handling.
- **Metadata management:** Store relevant user, account, and file metadata in MySQL.

> Feature availability depends on which provider APIs and integrations are implemented in the repository.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python |
| Database | MySQL |
| Cloud storage integrations | Provider APIs, such as Google Drive, Dropbox, and OneDrive |
| Authentication | Provider-supported token-based authorization |

## System Requirements

Install the tools required by the actual code in this repository. The project report identifies these core technologies:

- Node.js and npm for the React.js frontend
- Python 3 for the backend
- MySQL Server
- API credentials and permissions for each cloud provider you intend to connect

The exact versions and Python packages depend on the implementation. Check the frontend package manifest and backend dependency file (for example, `package.json`, `requirements.txt`, or `pyproject.toml`) if they are present.

## Getting Started

The report describes the overall technology stack but does not specify the repository's exact commands, environment-variable names, or database schema. Use the following as a general setup checklist and adjust it to match the source code.

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Configure the backend

1. Open the backend directory.
2. Create and activate a Python virtual environment.
3. Install the dependencies listed by the project, if a dependency file is provided.
4. Configure the database connection and cloud-provider API credentials using the configuration method supported by the code.
5. Start the backend using the entry point documented in the source code.

Example virtual-environment commands:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

If the repository contains `requirements.txt`, install its packages with:

```bash
pip install -r requirements.txt
```

### 3. Configure the database

1. Start MySQL Server.
2. Create a database for the application.
3. Configure the backend with the database name, host, username, and password.
4. Run the SQL schema or migration steps provided by the repository.

Do not commit real database passwords or API secrets to source control.

### 4. Configure and start the frontend

1. Open the frontend directory.
2. Install dependencies:

```bash
npm install
```

3. Configure the backend URL if the frontend uses an environment variable.
4. Start the development server using the script defined in `package.json`, commonly:

```bash
npm start
```

Some React projects use `npm run dev` instead. Check `package.json` for the correct command.

## Typical Workflow

1. Open the application.
2. Sign in or complete the authentication flow, if implemented.
3. Connect an available cloud storage provider.
4. View files from connected accounts.
5. Select a source and destination for a file transfer, if supported.
6. Check the application's status or result message to confirm the operation.

## Security Notes

- Never commit API keys, OAuth client secrets, access tokens, or production passwords.
- Use environment variables or a local, untracked configuration file for secrets.
- Request only the permissions needed for the features being used.
- Protect tokens and avoid printing them in logs.
- Validate file operations and handle provider API errors safely.
- Use test accounts and non-sensitive files during development.

## Project Structure

The exact folder layout depends on the repository. A typical arrangement for this stack might look like:

```text
project/
├── frontend/       # React.js user interface
├── backend/        # Python application and API endpoints
├── database/       # SQL schema or migration files, if included
├── .gitignore
└── README.md
```

Treat this as an illustrative layout; use the actual directory names in the repository.

## Troubleshooting

- **Frontend dependencies fail:** Confirm Node.js and npm are installed, then check `package.json`.
- **Backend dependencies fail:** Confirm Python is installed and install packages from the repository's dependency file.
- **Database connection fails:** Check that MySQL is running and the configured connection details are correct.
- **Cloud account connection fails:** Verify provider API setup, redirect/callback URLs, requested permissions, and token configuration.
- **File transfer fails:** Check source/destination permissions, provider API limits, network access, and backend logs. Avoid sharing logs that contain tokens or secrets.

## Current Status

This README is based on the project report titled **Multi-Cloud Storage Management System**. It describes the intended system and technology stack; confirm the actual implemented features and commands against the repository before publishing.

## Contributing

1. Create a branch for your change.
2. Make and test your updates.
3. Do not include secrets or private files in commits.
4. Submit a pull request with a concise description of the change.

## License

Add the license used by this repository. If no license has been selected, the project should not be assumed to be open source by default.
## Photos 
<img width="1102" height="535" alt="image" src="https://github.com/user-attachments/assets/9d502db8-a07f-4a9b-87fb-5c8f8bd444d8" />
<img width="1069" height="523" alt="image" src="https://github.com/user-attachments/assets/a58da1e5-5764-4545-b291-44a0762865f3" />
<img width="1079" height="511" alt="image" src="https://github.com/user-attachments/assets/7e6c179f-3354-4f35-8ca4-6f2bb5a5ec6b" />
<img width="1079" height="511" alt="image" src="https://github.com/user-attachments/assets/d078de5c-5eaa-4223-8657-674e58a67276" />
<img width="1080" height="509" alt="image" src="https://github.com/user-attachments/assets/e5113cb1-017c-4d19-bb14-b636dfb2c352" />
<img width="1079" height="513" alt="image" src="https://github.com/user-attachments/assets/22d969e4-a206-4062-8a04-754d51ea92d4" />
<img width="1080" height="510" alt="image" src="https://github.com/user-attachments/assets/8826c7a5-e543-4ede-b46d-f6de05c0d02f" />
<img width="1080" height="514" alt="image" src="https://github.com/user-attachments/assets/5d4f5be9-43f4-443f-8372-fb49cacdfd9a" />
<img width="1080" height="514" alt="image" src="https://github.com/user-attachments/assets/e09456bd-3640-4d59-9d65-c815864e2a54" />
<img width="1079" height="512" alt="image" src="https://github.com/user-attachments/assets/17c42a5f-6c49-41de-b06c-f621b528ab20" />
