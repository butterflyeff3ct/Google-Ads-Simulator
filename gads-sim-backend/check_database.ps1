# Check SQL Server Tables - Quick Script
# Run from: E:\Project\Google_Ads_Sim\google_ads_sim\gads-sim-backend

Write-Host "Checking SQL Server Database..." -ForegroundColor Cyan
Write-Host ""

# Activate venv
$venvPath = "venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    & $venvPath
}

Write-Host "Connecting to SQL Server..." -ForegroundColor Yellow

# Python script to check tables
$pythonScript = @"
import pyodbc
import sys

try:
    # Connect to SQL Server
    conn = pyodbc.connect(
        'DRIVER={SQL Server};'
        'SERVER=localhost,1433;'
        'DATABASE=GoogleAdsSim;'
        'UID=sa;'
        'PWD=YourStrong@Passw0rd'
    )
    cursor = conn.cursor()
    
    print('\n' + '='*60)
    print('DATABASE: GoogleAdsSim')
    print('='*60 + '\n')
    
    # List tables
    print('TABLES:')
    print('-'*60)
    cursor.execute(\"\"\"
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    \"\"\")
    
    tables = []
    for row in cursor:
        table_name = row[0]
        tables.append(table_name)
        print(f'  ✓ {table_name}')
    
    print('\n' + '='*60)
    print(f'Total Tables: {len(tables)}')
    print('='*60 + '\n')
    
    # Count records in each table
    print('RECORD COUNTS:')
    print('-'*60)
    for table in tables:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f'  {table}: {count} records')
    
    print('\n' + '='*60)
    
    # Show latest users
    print('\nLATEST USERS:')
    print('-'*60)
    cursor.execute(\"\"\"
        SELECT TOP 5 email, name, last_login 
        FROM users 
        ORDER BY ISNULL(last_login, signup_timestamp) DESC
    \"\"\")
    
    for row in cursor:
        email, name, last_login = row
        print(f'  • {email} ({name}) - Last: {last_login or "Never"}')
    
    # Show latest activities
    print('\nLATEST ACTIVITIES:')
    print('-'*60)
    cursor.execute(\"\"\"
        SELECT TOP 5 session_id, login_time, page_views, status 
        FROM user_activities 
        ORDER BY login_time DESC
    \"\"\")
    
    for row in cursor:
        session_id, login_time, page_views, status = row
        print(f'  • {session_id} - {login_time} ({page_views} views, {status})')
    
    print('\n' + '='*60)
    print('✅ DATABASE CHECK COMPLETE')
    print('='*60 + '\n')
    
    conn.close()
    
except Exception as e:
    print(f'\n❌ Error: {str(e)}\n')
    sys.exit(1)
"@

# Run the Python script
python -c $pythonScript

Write-Host ""
Read-Host "Press Enter to exit"
