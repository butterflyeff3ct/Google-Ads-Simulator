# Install Dependencies and ODBC Driver
# This script installs all required dependencies for SQL Server connectivity

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Installing SQL Server Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "E:\Project\Google_Ads_Sim\google_ads_sim\gads-sim-backend"
Set-Location $backendPath

# Step 1: Check if ODBC Driver is installed
Write-Host "[1/4] Checking ODBC Driver for SQL Server..." -ForegroundColor Yellow

$odbcDrivers = Get-OdbcDriver -Name "*SQL Server*" -ErrorAction SilentlyContinue

if ($odbcDrivers) {
    Write-Host "  Success: Found ODBC Drivers:" -ForegroundColor Green
    $odbcDrivers | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Cyan }
}
else {
    Write-Host "  Warning: No ODBC Driver for SQL Server found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  You need to install the Microsoft ODBC Driver for SQL Server" -ForegroundColor Yellow
    Write-Host "  Download from: https://aka.ms/downloadmsodbcsql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Options:" -ForegroundColor Yellow
    Write-Host "  1. ODBC Driver 17 for SQL Server (Recommended)" -ForegroundColor White
    Write-Host "  2. ODBC Driver 18 for SQL Server (Latest)" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Do you want to open the download page now? (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        Start-Process "https://aka.ms/downloadmsodbcsql"
        Write-Host ""
        Write-Host "Please install the driver and run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit
    }
}

Write-Host ""

# Step 2: Activate virtual environment
Write-Host "[2/4] Activating virtual environment..." -ForegroundColor Yellow

$venvPath = Join-Path $backendPath "venv\Scripts\Activate.ps1"

if (Test-Path $venvPath) {
    Write-Host "  Activating venv..." -ForegroundColor Cyan
    & $venvPath
    Write-Host "  Success: Virtual environment activated" -ForegroundColor Green
}
else {
    Write-Host "  Error: Virtual environment not found" -ForegroundColor Red
    Write-Host "  Creating virtual environment..." -ForegroundColor Yellow
    
    python -m venv venv
    & $venvPath
    
    Write-Host "  Success: Virtual environment created and activated" -ForegroundColor Green
}

Write-Host ""

# Step 3: Upgrade pip
Write-Host "[3/4] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
Write-Host "  Success: pip upgraded" -ForegroundColor Green

Write-Host ""

# Step 4: Install all dependencies
Write-Host "[4/4] Installing dependencies from requirements.txt..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Cyan
Write-Host ""

pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Success: All dependencies installed!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "  Warning: Some dependencies may have failed to install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verify pyodbc installation
Write-Host "Verifying pyodbc installation..." -ForegroundColor Yellow
python -c "import pyodbc; print(f'Success: pyodbc version {pyodbc.version} installed')" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Success: pyodbc is working correctly" -ForegroundColor Green
}
else {
    Write-Host "  Error: pyodbc installation failed" -ForegroundColor Red
    Write-Host "  This usually means the ODBC Driver is not installed" -ForegroundColor Yellow
    Write-Host "  Download from: https://aka.ms/downloadmsodbcsql" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: python init_database.py" -ForegroundColor White
Write-Host "2. Run: python test_sql_integration.py" -ForegroundColor White
Write-Host "3. Start backend: python -m uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
