# Deployment Instructions - Keeping Credentials Private

This project is configured so that **users will use YOUR API credentials** while keeping them hidden from GitHub.

## 🔐 How It Works

The credentials are stored locally on your server but are **never pushed to GitHub**:

### Protected Files (Already configured):
- ✅ `gads-sim-backend/config.yaml` - Your Google Ads API credentials
- ✅ `gads-sim-backend/.env` - Backend environment variables
- ✅ `gads-sim-frontend/.env.local` - Frontend environment variables
- ✅ `.env` - Docker database password

These files are in `.gitignore` and will **NOT** be pushed to GitHub.

## 📦 What Gets Pushed to GitHub

**Safe to push:**
- ✅ All source code files
- ✅ `env.example` files (templates without real credentials)
- ✅ `config.yaml.example` (template without real credentials)
- ✅ Documentation files
- ✅ `.gitignore` files
- ✅ `requirements.txt` and `package.json`

**Never pushed (automatically ignored):**
- ❌ `config.yaml` - Contains your real API keys
- ❌ `.env` files - Contains your real credentials
- ❌ `access_requests.json` - Contains user data
- ❌ `cache/` directory - Contains cached API responses
- ❌ `venv/` and `node_modules/` - Dependencies
- ❌ Database files

## 🚀 Initial Setup (One Time)

### 1. Verify Files Are Ignored

Run this command to verify your sensitive files won't be pushed:

```powershell
# Check which sensitive files are ignored
git check-ignore -v gads-sim-backend/config.yaml
git check-ignore -v gads-sim-backend/.env
git check-ignore -v gads-sim-frontend/.env.local

# You should see output like:
# gads-sim-backend/.gitignore:20:config.yaml      gads-sim-backend/config.yaml
# gads-sim-backend/.gitignore:15:.env     gads-sim-backend/.env
```

### 2. Add Your Gemini API Key

If you have a Gemini API key, add it to:

**File: `gads-sim-backend/.env`**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**File: `gads-sim-backend/config.yaml`** (if using config.yaml approach)
```yaml
gemini_api_key: your_actual_gemini_api_key_here
```

### 3. Commit and Push to GitHub

```bash
# Stage all files
git add .

# Check what will be committed (should NOT include config.yaml or .env)
git status

# If you see config.yaml or .env listed, STOP and check your .gitignore
# Otherwise, commit:
git commit -m "Initial commit"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/google-ads-sim.git
git push -u origin main
```

## 🖥️ Deploying to a Server

When deploying to a production server:

### Option 1: Manual File Transfer (Recommended)

1. **Push code to GitHub** (without credentials)
2. **On your server:**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/google-ads-sim.git
   cd google-ads-sim
   ```

3. **Manually copy credential files to server** (via SCP, SFTP, or direct edit):
   ```bash
   # Backend credentials
   nano gads-sim-backend/config.yaml
   # Paste your credentials
   
   # Or copy from local machine
   scp local-backups/config.yaml user@server:/path/to/google-ads-sim/gads-sim-backend/
   ```

4. **Set proper file permissions**:
   ```bash
   # Make credentials readable only by owner
   chmod 600 gads-sim-backend/config.yaml
   chmod 600 gads-sim-backend/.env
   chmod 600 gads-sim-frontend/.env.local
   ```

### Option 2: Environment Variables (Production Best Practice)

For production, use environment variables instead of files:

1. **Set environment variables on server**:
   ```bash
   # Add to /etc/environment or ~/.bashrc
   export GOOGLE_ADS_DEVELOPER_TOKEN="RpP3OfhAQusLYY0-o9GqLA"
   export GOOGLE_ADS_CLIENT_ID="440753161135-u26lkfir6euuqvemj3strv3juur8egrr.apps.googleusercontent.com"
   # ... etc for all credentials
   ```

2. **Or use a secrets manager** (AWS Secrets Manager, Azure Key Vault, etc.)

3. **The code already supports this** - it will read from environment variables first, then fall back to config.yaml

## 👥 For New Developers Joining Your Project

When someone clones your repository, they will need to:

1. **Clone the repo** (credentials not included)
   ```bash
   git clone https://github.com/yourusername/google-ads-sim.git
   ```

2. **You must provide them with:**
   - The `config.yaml` file (send via secure channel)
   - Or the `.env` file with credentials
   - Or just tell them to use the shared deployment

3. **They should place files in correct locations:**
   ```
   google-ads-sim/
   ├── gads-sim-backend/
   │   ├── config.yaml          ← Place here
   │   └── .env                 ← Or here
   └── gads-sim-frontend/
       └── .env.local           ← And here
   ```

## 🔄 Updating Credentials

If you need to update API keys:

1. **Update locally** in `config.yaml` or `.env`
2. **Git will ignore the changes** (they won't show in `git status`)
3. **Manually update on production server** if deployed

## ⚠️ Security Reminders

### DO:
- ✅ Keep local backups of credential files (outside git repository)
- ✅ Use different credentials for development vs production
- ✅ Regularly rotate API keys
- ✅ Monitor API usage for unauthorized access
- ✅ Use environment variables in production
- ✅ Set restrictive file permissions (600) on credential files

### DON'T:
- ❌ Remove files from `.gitignore`
- ❌ Use `git add -f` to force-add ignored files
- ❌ Commit `.env` or `config.yaml` files
- ❌ Share credentials in public forums or chat
- ❌ Email credentials (use encrypted channels)
- ❌ Hard-code credentials in source code

## 🧪 Verification Commands

Before pushing to GitHub, run these checks:

```powershell
# 1. Check what will be committed
git status

# 2. Verify sensitive files are ignored
git status --ignored | Select-String "config.yaml|\.env"

# 3. Check .gitignore is working
git check-ignore -v gads-sim-backend/config.yaml

# 4. Dry run to see what would be pushed
git add --dry-run -A

# 5. Search for potential exposed secrets in staged files
git diff --cached | Select-String "developer_token|client_secret|GOCSPX"
# Should return nothing!
```

## 🎯 Summary

**Current Setup:**
- ✅ Your credentials are in `config.yaml` (ignored by git)
- ✅ Users will use YOUR Google Ads API and Gemini API
- ✅ Credentials stay on your local machine and production server only
- ✅ Safe to push to public GitHub repository
- ✅ Other developers get code without credentials

**To Deploy:**
1. Push code to GitHub (safe - no credentials included)
2. Clone on server
3. Manually add credential files to server
4. Done!

---

**Questions?** The credentials are protected and won't be pushed to GitHub. You can safely deploy! 🚀

