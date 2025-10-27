# Google Ads Simulator - Quick Start Script
# Starts both backend and frontend servers

Write-Host "Starting Google Ads Simulator..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir

# Backend setup
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "gads-sim-backend"

# Check if backend directory exists
if (-not (Test-Path $backendPath)) {
    Write-Host "Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

# Start backend in new PowerShell window
$backendScript = @"
Set-Location '$backendPath'
if (Test-Path '.\venv\Scripts\Activate.ps1') {
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host 'Virtual environment not found. Please run setup first.' -ForegroundColor Red
    Write-Host 'Run: python -m venv venv' -ForegroundColor Yellow
    Write-Host 'Then: .\venv\Scripts\Activate.ps1' -ForegroundColor Yellow
    Write-Host 'Then: pip install -r requirements.txt' -ForegroundColor Yellow
    pause
    exit
}
Write-Host 'Backend starting on http://localhost:8000' -ForegroundColor Green
Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Cyan
Write-Host ''
uvicorn app.main:app --reload
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$backendScript

# Wait a moment for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Frontend setup
Write-Host ""
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "gads-sim-frontend"

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

# Start frontend in new PowerShell window
$frontendScript = @"
Set-Location '$frontendPath'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Node modules not found. Please run: npm install' -ForegroundColor Red
    pause
    exit
}
Write-Host 'Frontend starting on http://localhost:3000' -ForegroundColor Green
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendScript

# Success message
Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:     http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Press Ctrl+C in the server windows to stop them" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ready to simulate Google Ads campaigns!" -ForegroundColor Green
Write-Host ""
