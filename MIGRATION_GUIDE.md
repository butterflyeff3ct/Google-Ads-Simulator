# Migration Guide: Securing Your Installation

This guide helps you migrate from the old configuration system to the new secure environment-variable-based system.

## 🔄 What Changed?

### Old System (Insecure)
- ❌ Credentials in `config.yaml` (committed to git)
- ❌ Hardcoded admin emails in code
- ❌ Database passwords in docker-compose
- ❌ API keys exposed in files

### New System (Secure)
- ✅ All secrets in `.env` files (gitignored)
- ✅ Admin emails from environment variables
- ✅ Docker uses environment variables
- ✅ Clear separation of config and secrets

## 📝 Migration Steps

### Step 1: Backup Your Old Configuration

Before making changes, save your current credentials:

```bash
# Backup config.yaml
cp gads-sim-backend/config.yaml gads-sim-backend/config.yaml.backup

# Keep this backup file OUTSIDE the git repository
mv gads-sim-backend/config.yaml.backup ~/safe-location/
```

### Step 2: Create Backend .env File

1. Navigate to backend directory:
   ```bash
   cd gads-sim-backend
   ```

2. Copy the example file:
   ```bash
   cp env.example .env
   ```

3. Open your backed-up `config.yaml.backup` and copy values to `.env`:

   **From config.yaml:**
   ```yaml
   developer_token: YOUR_DEVELOPER_TOKEN_HERE
   client_id: YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   client_secret: YOUR_CLIENT_SECRET_HERE
   refresh_token: YOUR_REFRESH_TOKEN_HERE
   customer_id: YOUR_CUSTOMER_ID_HERE
   login_customer_id: YOUR_LOGIN_CUSTOMER_ID_HERE
   ```

   **To .env:**
   ```env
   GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN_HERE
   GOOGLE_ADS_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   GOOGLE_ADS_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
   GOOGLE_ADS_CUSTOMER_ID=YOUR_CUSTOMER_ID_HERE
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=YOUR_LOGIN_CUSTOMER_ID_HERE
   GOOGLE_ADS_USE_PROTO_PLUS=True
   ```

4. Add your Gemini API key if you have one:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Configure database (change the password!):
   ```env
   DB_SERVER=localhost
   DB_PORT=1433
   DB_NAME=GoogleAdsSim
   DB_USER=sa
   DB_PASSWORD=YourNewStrongPassword123!
   DB_DRIVER=SQL Server
   ```

### Step 3: Create Frontend .env.local File

1. Navigate to frontend directory:
   ```bash
   cd ../gads-sim-frontend
   ```

2. Copy the example file:
   ```bash
   cp env.example .env.local
   ```

3. Fill in your values:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
   
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   
   ADMIN_EMAILS=your_admin_email@example.com
   ```

4. Generate NEXTAUTH_SECRET:
   ```bash
   # Linux/Mac/Git Bash
   openssl rand -base64 32
   
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```
   
   Copy the output to `NEXTAUTH_SECRET` in `.env.local`

### Step 4: Update Docker Compose

1. Navigate to project root:
   ```bash
   cd ..
   ```

2. Create a `.env` file for Docker:
   ```bash
   echo "DB_PASSWORD=YourNewStrongPassword123!" > .env
   echo "DB_PORT=1433" >> .env
   ```

   Or create `.env` file manually:
   ```env
   DB_PASSWORD=YourNewStrongPassword123!
   DB_PORT=1433
   ```

3. Restart Docker containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Step 5: Remove Old Config Files

**⚠️ Warning**: Only do this AFTER confirming everything works!

```bash
# Remove config.yaml (it's now gitignored)
# But keep your backup safe elsewhere!
rm gads-sim-backend/config.yaml

# The .gitignore will prevent it from being committed
```

### Step 6: Test Your Setup

1. **Test Backend**:
   ```bash
   cd gads-sim-backend
   
   # Activate virtual environment
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate      # Windows
   
   # Start server
   uvicorn app.main:app --reload
   ```
   
   Visit: `http://localhost:8000/health`

2. **Test Frontend**:
   ```bash
   cd ../gads-sim-frontend
   npm run dev
   ```
   
   Visit: `http://localhost:3000`

3. **Test Login**:
   - Click "Sign In"
   - Login with Google
   - Verify you can access the application

4. **Test Simulation** (Optional):
   - Create a new campaign
   - Add keywords
   - Run simulation
   - Verify results display correctly

### Step 7: Verify Git Ignore

Check that sensitive files are properly ignored:

```bash
# This should NOT show .env files or config.yaml
git status

# If you see these files, ensure .gitignore is correct:
# - .env
# - .env.local
# - config.yaml
# - access_requests.json
```

## 🔍 Verification Checklist

Use this checklist to ensure migration is complete:

- [ ] Backend `.env` created with all credentials
- [ ] Frontend `.env.local` created with all credentials
- [ ] Docker `.env` created with database password
- [ ] `NEXTAUTH_SECRET` generated and added
- [ ] `ADMIN_EMAILS` configured
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Can log in successfully
- [ ] Can run simulations successfully
- [ ] `config.yaml` removed (backup saved elsewhere)
- [ ] `git status` shows no sensitive files
- [ ] Database password changed from default

## 🐛 Troubleshooting

### Issue: "Missing GOOGLE_ADS_DEVELOPER_TOKEN"

**Cause**: Backend `.env` not loaded or incorrect.

**Solution**:
1. Verify `.env` file exists in `gads-sim-backend/`
2. Verify file is named exactly `.env` (not `.env.txt`)
3. Ensure no spaces around `=` in `.env` file
4. Restart backend server

### Issue: "NextAuth configuration error"

**Cause**: Frontend `.env.local` missing or incorrect.

**Solution**:
1. Verify `.env.local` exists in `gads-sim-frontend/`
2. Ensure `NEXTAUTH_SECRET` is set
3. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match backend
4. Restart frontend server

### Issue: Database connection failed

**Cause**: Docker not reading `.env` or password mismatch.

**Solution**:
1. Ensure `.env` file exists in project root (same directory as `docker-compose.yml`)
2. Verify password in root `.env` matches `gads-sim-backend/.env`
3. Restart Docker:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Issue: Admin access denied

**Cause**: `ADMIN_EMAILS` not configured.

**Solution**:
1. Add your email to frontend `.env.local`:
   ```env
   ADMIN_EMAILS=your_email@example.com,another_admin@example.com
   ```
2. Restart frontend server
3. Log out and log back in

## 📋 Environment Variables Reference

### Backend (.env)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads Developer Token | `RpP3OfhAQusLYY0-o9GqLA` | Yes |
| `GOOGLE_ADS_CLIENT_ID` | OAuth Client ID | `12345.apps.googleusercontent.com` | Yes |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth Client Secret | `GOCSPX-xxxxx` | Yes |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth Refresh Token | `1//05xxx...` | Yes |
| `GOOGLE_ADS_CUSTOMER_ID` | Google Ads Customer ID | `1234567890` | Yes |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Login Customer ID | `1234567890` | Yes |
| `GEMINI_API_KEY` | Gemini AI API Key | `AIzaSyxxxxx` | No |
| `DB_SERVER` | Database Server | `localhost` | Yes |
| `DB_PORT` | Database Port | `1433` | Yes |
| `DB_NAME` | Database Name | `GoogleAdsSim` | Yes |
| `DB_USER` | Database User | `sa` | Yes |
| `DB_PASSWORD` | Database Password | `Strong@Pass123` | Yes |

### Frontend (.env.local)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` | Yes |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | Same as backend | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Same as backend | Yes |
| `NEXTAUTH_URL` | Frontend URL | `http://localhost:3000` | Yes |
| `NEXTAUTH_SECRET` | NextAuth Secret | Random 32-byte string | Yes |
| `ADMIN_EMAILS` | Admin emails (comma-separated) | `admin@example.com` | Yes |

### Docker (.env in project root)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DB_PASSWORD` | SQL Server Password | `Strong@Pass123` | Yes |
| `DB_PORT` | SQL Server Port | `1433` | No |

## 🎉 Migration Complete!

Once all steps are complete and tests pass:

1. ✅ Your secrets are now secure
2. ✅ Ready to commit to GitHub
3. ✅ Team members can clone and setup using their own credentials
4. ✅ No more accidental secret commits

## 🚀 Ready to Push to GitHub

Now that your project is secure, you can safely push to GitHub:

```bash
# Initialize git (if not already)
git init

# Add all files (sensitive files will be ignored)
git add .

# Check what will be committed (should NOT include .env or config.yaml)
git status

# Commit
git commit -m "Initial commit - Secure configuration"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/google-ads-sim.git

# Push to GitHub
git push -u origin main
```

---

**Need Help?** Review SECURITY.md and SETUP_GUIDE.md for additional information.

