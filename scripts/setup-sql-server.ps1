# Google Ads Simulator - SQL Server Setup Script
# This script helps set up the SQL Server database for the Google Ads Simulator

Write-Host "🚀 Google Ads Simulator - SQL Server Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "`n📋 Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not running." -ForegroundColor Red
    exit 1
}

# Check if SQL Server container is running
Write-Host "`n📋 Checking SQL Server container..." -ForegroundColor Yellow
$sqlContainer = docker ps --filter "name=sql-server-container" --format "table {{.Names}}\t{{.Status}}"
if ($sqlContainer -match "sql-server-container") {
    Write-Host "✅ SQL Server container is running" -ForegroundColor Green
} else {
    Write-Host "❌ SQL Server container is not running." -ForegroundColor Red
    Write-Host "Please start the SQL Server container first:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor Cyan
    exit 1
}

# Install Python dependencies
Write-Host "`n📋 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location "gads-sim-backend"

if (Test-Path "venv") {
    Write-Host "✅ Virtual environment exists" -ForegroundColor Green
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
}

Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "`n📋 Setting up environment variables..." -ForegroundColor Yellow
$env:DB_SERVER = "localhost"
$env:DB_PORT = "1433"
$env:DB_NAME = "GoogleAdsSim"
$env:DB_USER = "sa"
$env:DB_PASSWORD = "YourStrong@Passw0rd"
$env:DB_DRIVER = "ODBC Driver 17 for SQL Server"

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  DB_SERVER: $env:DB_SERVER" -ForegroundColor Cyan
Write-Host "  DB_PORT: $env:DB_PORT" -ForegroundColor Cyan
Write-Host "  DB_NAME: $env:DB_NAME" -ForegroundColor Cyan
Write-Host "  DB_USER: $env:DB_USER" -ForegroundColor Cyan

# Test database connection
Write-Host "`n📋 Testing database connection..." -ForegroundColor Yellow
python -c @"
import pyodbc
try:
    conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost,1433;DATABASE=master;UID=sa;PWD=YourStrong@Passw0rd')
    print('Database connection successful')
    conn.close()
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database connection test passed" -ForegroundColor Green
} else {
    Write-Host "Database connection test failed" -ForegroundColor Red
    Write-Host "Please check your SQL Server container configuration." -ForegroundColor Yellow
    exit 1
}

# Initialize database
Write-Host "`n📋 Initializing database..." -ForegroundColor Yellow
python init_database.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialization completed" -ForegroundColor Green
} else {
    Write-Host "Database initialization failed" -ForegroundColor Red
    exit 1
}

# Start the FastAPI application
Write-Host "`n📋 Starting FastAPI application..." -ForegroundColor Yellow
Write-Host "The application will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "API documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the application" -ForegroundColor Yellow

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
