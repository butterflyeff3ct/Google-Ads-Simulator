# Complete Setup Guide

This guide provides detailed instructions for setting up the Google Ads Campaign Simulator from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Getting API Credentials](#getting-api-credentials)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Troubleshooting](#troubleshooting)
5. [Optional Features](#optional-features)

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 2 GB for dependencies and cache
- **Internet**: Stable connection for API calls

### Software Requirements
- **Python**: 3.9, 3.10, or 3.11
- **Node.js**: 16.x or 18.x (LTS versions)
- **npm**: 8.x or higher (comes with Node.js)
- **Git**: Latest version
- **SQL Server**: 2022 (or use Docker)
- **Docker**: Latest version (optional, for SQL Server)

### Verify Installations

```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check Docker version (if using)
docker --version
```

## Getting API Credentials

### 1. Google Ads API Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Google Ads Simulator"
4. Click "Create"

#### Step 2: Enable Google Ads API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Ads API"
3. Click "Google Ads API" → "Enable"

#### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen (if prompted):
   - User type: External
   - App name: "Google Ads Simulator"
   - Support email: Your email
   - Authorized domains: `localhost`
4. Select "Application type": Web application
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:8000/oauth2callback`
6. Click "Create"
7. **Save** the Client ID and Client Secret

#### Step 4: Generate Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top-right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, select "Google Ads API v14" → "https://www.googleapis.com/auth/adwords"
6. Click "Authorize APIs"
7. Sign in with your Google account
8. Click "Exchange authorization code for tokens"
9. **Copy the Refresh Token**

#### Step 5: Get Developer Token

1. Sign in to [Google Ads](https://ads.google.com/)
2. Click "Tools & Settings" → "Setup" → "API Center"
3. Apply for a Developer Token
4. While waiting for approval, you can use test mode
5. **Copy the Developer Token**

#### Step 6: Get Customer ID

1. In Google Ads, look at the top-right corner
2. You'll see a number like "123-456-7890"
3. Remove dashes: "1234567890"
4. This is your Customer ID

### 2. Gemini AI API Setup (Optional)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Select your Google Cloud project
5. **Copy the API Key**

### 3. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
# On Linux/Mac/Git Bash
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Step-by-Step Setup

### Phase 1: Clone and Navigate

```bash
# Clone the repository
git clone https://github.com/yourusername/google-ads-sim.git
cd google-ads-sim
```

### Phase 2: Backend Setup

#### 1. Create Python Virtual Environment

```bash
cd gads-sim-backend

# On Windows
python -m venv venv
venv\Scripts\activate

# On Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### 2. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will take 2-5 minutes depending on your internet speed.

#### 3. Configure Backend Environment

```bash
# Copy the example file
cp env.example .env

# On Windows PowerShell
Copy-Item env.example .env
```

Edit `.env` file with your favorite text editor:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_from_step_5
GOOGLE_ADS_CLIENT_ID=your_client_id_from_step_3.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_from_step_3
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_from_step_4
GOOGLE_ADS_CUSTOMER_ID=your_customer_id_from_step_6
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_customer_id_from_step_6
GOOGLE_ADS_USE_PROTO_PLUS=True

# Gemini AI API Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_from_gemini_setup

# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=GoogleAdsSim
DB_USER=sa
DB_PASSWORD=ChangeThisPassword123!
DB_DRIVER=SQL Server
DB_TRUSTED_CONNECTION=no
```

**Important**: Replace all `your_*` placeholders with actual values!

#### 4. Setup SQL Server Database

**Option A: Using Docker (Recommended)**

```bash
# Navigate to project root
cd ..

# Start SQL Server container
docker-compose up -d

# Verify it's running
docker ps

# Initialize database (wait 30 seconds for SQL Server to start)
cd gads-sim-backend
python init_database.py
```

**Option B: Using Local SQL Server**

If you have SQL Server installed locally:

```bash
# Ensure SQL Server is running
# Windows: Check Services for "SQL Server (MSSQLSERVER)"

# Update .env with your SQL Server credentials
# Then initialize database
python init_database.py
```

#### 5. Test Backend

```bash
# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Open browser to `http://localhost:8000/docs` to see the API documentation.

**Keep this terminal open** and the server running.

### Phase 3: Frontend Setup

Open a **new terminal** window.

#### 1. Install Node Dependencies

```bash
cd gads-sim-frontend
npm install
```

This will take 3-7 minutes.

#### 2. Configure Frontend Environment

```bash
# Copy the example file
cp env.example .env.local

# On Windows PowerShell
Copy-Item env.example .env.local
```

Edit `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Google OAuth (use same credentials from backend)
GOOGLE_CLIENT_ID=your_client_id_from_step_3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_from_step_3

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_from_openssl_command

# Admin Email (your email to have admin access)
ADMIN_EMAILS=your_email@example.com
```

#### 3. Start Frontend Server

```bash
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Phase 4: Verify Installation

1. **Backend Health Check**
   - Open: `http://localhost:8000/health`
   - Should see: `{"status":"healthy","cache":"active","simulator":"ready"}`

2. **Frontend Access**
   - Open: `http://localhost:3000`
   - You should see the landing page

3. **Test Login**
   - Click "Sign In"
   - Sign in with Google
   - You should be redirected to the home page

4. **Test Simulation** (Optional)
   - Navigate through the campaign wizard
   - Add keywords
   - Run a simulation
   - Verify results are displayed

## Troubleshooting

### Common Issues

#### Issue 1: Python Module Not Found

```bash
# Error: ModuleNotFoundError: No module named 'X'
# Solution: Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows

# Then reinstall
pip install -r requirements.txt
```

#### Issue 2: SQL Server Connection Failed

```bash
# Error: "Login failed for user 'sa'"
# Solution 1: Wait 30-60 seconds after starting Docker, SQL Server needs time to initialize

# Solution 2: Check if SQL Server is running
docker ps  # Should show sql-server-container

# Solution 3: Restart container
docker-compose down
docker-compose up -d

# Solution 4: Check password in docker-compose.yml matches .env
```

#### Issue 3: Port Already in Use

```bash
# Error: "Address already in use"
# Solution for Backend (port 8000):
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Solution for Frontend (port 3000):
npm run dev -- -p 3001
```

#### Issue 4: Google Ads API Authentication Failed

```bash
# Error: "Invalid OAuth credentials"
# Checklist:
# 1. Verify Client ID and Secret are correct
# 2. Ensure Refresh Token is not expired
# 3. Check redirect URIs in Google Cloud Console
# 4. Verify Developer Token is approved (or using test account)
```

#### Issue 5: NextAuth Configuration Error

```bash
# Error: "Missing NEXTAUTH_SECRET"
# Solution: Generate and add to .env.local
openssl rand -base64 32
# Copy output to .env.local as NEXTAUTH_SECRET
```

### Database Troubleshooting

#### Reset Database

If you need to reset the database:

```bash
# Stop containers
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker volume rm google_ads_sim_sqlserver_data

# Restart
docker-compose up -d

# Wait 30 seconds, then reinitialize
cd gads-sim-backend
python init_database.py
```

#### Check Database Connection

```python
# Run this Python script to test connection
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

conn_str = f"DRIVER={{SQL Server}};SERVER=localhost,1433;DATABASE=GoogleAdsSim;UID=sa;PWD={os.getenv('DB_PASSWORD')}"
try:
    conn = pyodbc.connect(conn_str)
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

### Frontend Troubleshooting

#### Clear Next.js Cache

```bash
# Remove build cache
rm -rf .next

# On Windows
Remove-Item -Recurse -Force .next

# Rebuild
npm run dev
```

#### Check Environment Variables

```bash
# Verify .env.local is loaded
# Add this to any page and check browser console:
console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
```

## Optional Features

### Enable Gemini AI Keywords

1. Get Gemini API key (see section above)
2. Add to backend `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Restart backend server
4. "AI Max" feature will now work in the frontend

### Enable Production Mode

#### Backend

```bash
# Install gunicorn
pip install gunicorn

# Run in production mode
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Setup HTTPS (Production)

For production deployment, use a reverse proxy like nginx or Caddy:

#### Using Caddy (Easiest)

```caddy
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    reverse_proxy localhost:8000
}
```

## Next Steps

1. ✅ Explore the Campaign Wizard
2. ✅ Try creating a simulation
3. ✅ Check out the Admin Dashboard (if you're an admin)
4. ✅ Review the API documentation at `/docs`
5. ✅ Star the repository if you find it useful!

## Support

If you encounter issues not covered here:

1. Check the main README.md
2. Review SECURITY.md for configuration issues
3. Search existing GitHub issues
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Python version, Node version)

---

**Congratulations!** 🎉 You've successfully set up the Google Ads Campaign Simulator!

