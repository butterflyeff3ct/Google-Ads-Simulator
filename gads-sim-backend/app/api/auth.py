from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

router = APIRouter()

class UserData(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    provider: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None

class SheetsConfig(BaseModel):
    spreadsheet_id: str
    service_account_email: str
    private_key: str

def get_sheets_service():
    """Initialize Google Sheets service with service account credentials."""
    try:
        # Try to load from service account file first
        credentials_file = os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE")
        if credentials_file and os.path.exists(credentials_file):
            credentials = service_account.Credentials.from_service_account_file(
                credentials_file,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
        else:
            # Fallback to environment variables
            service_account_info = {
                "type": "service_account",
                "project_id": os.getenv("GOOGLE_PROJECT_ID"),
                "private_key_id": os.getenv("GOOGLE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            }
            
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
        
        service = build('sheets', 'v4', credentials=credentials)
        return service
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Google Sheets service: {str(e)}")

def get_user_data_config() -> Dict[str, Any]:
    """Get configuration for what user data to store."""
    return {
        "basic_fields": [
            "id", "name", "email", "image", "provider"
        ],
        "custom_fields": {
            "signup_date": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "login_count": 1,
            "user_agent": "",
            "ip_address": "",
            "timestamp": datetime.now().isoformat()
        },
        "exclude_fields": [
            "accessToken", "refreshToken"
        ],
        "sheet_config": {
            "name": "Users",
            "auto_create": True,
            "format_headers": True
        }
    }

async def check_sheet_exists(service, spreadsheet_id: str, sheet_name: str) -> bool:
    """Check if a sheet exists in the spreadsheet."""
    try:
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = spreadsheet.get('sheets', [])
        return any(sheet['properties']['title'] == sheet_name for sheet in sheets)
    except HttpError:
        return False

async def create_sheet_with_headers(service, spreadsheet_id: str, sheet_name: str, headers: list):
    """Create a new sheet with headers."""
    try:
        # Add new sheet
        request_body = {
            'requests': [{
                'addSheet': {
                    'properties': {
                        'title': sheet_name
                    }
                }
            }]
        }
        
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=request_body
        ).execute()
        
        # Add headers
        header_range = f"{sheet_name}!A1:{chr(65 + len(headers) - 1)}1"
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=header_range,
            valueInputOption='RAW',
            body={'values': [headers]}
        ).execute()
        
        # Format headers
        format_request = {
            'requests': [{
                'repeatCell': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': len(headers)
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9},
                            'textFormat': {'bold': True}
                        }
                    },
                    'fields': 'userEnteredFormat(backgroundColor,textFormat)'
                }
            }]
        }
        
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=format_request
        ).execute()
        
        print(f"Sheet '{sheet_name}' created with headers")
        
    except HttpError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create sheet: {str(e)}")

@router.post("/store-user")
async def store_user_data(user_data: UserData, request: Request):
    """Store user data in Google Sheets after OAuth authentication."""
    try:
        # Get IP address and user agent
        ip_address = request.headers.get('x-forwarded-for') or request.headers.get('x-real-ip') or 'unknown'
        user_agent = request.headers.get('user-agent') or 'unknown'
        
        # Get configuration
        config = get_user_data_config()
        
        # Prepare data to store
        data_to_store = {
            **config['custom_fields'],
            'user_agent': user_agent,
            'ip_address': ip_address,
            **user_data.dict()
        }
        
        # Filter data based on configuration
        filtered_data = {}
        all_fields = config['basic_fields'] + list(config['custom_fields'].keys())
        
        for field in all_fields:
            if field not in config['exclude_fields'] and field in data_to_store:
                filtered_data[field] = data_to_store[field]
        
        # Initialize Google Sheets service
        service = get_sheets_service()
        spreadsheet_id = "1rfIMS8YySdI0yOrsIHKj8Md80amZqarjzL5AYG4Dsts"  # Your Google Sheet ID
        
        if not spreadsheet_id:
            raise HTTPException(status_code=500, detail="GOOGLE_SHEETS_SPREADSHEET_ID environment variable not set")
        
        # Prepare row data
        row_data = list(filtered_data.values())
        header_row = list(filtered_data.keys())
        
        # Check if sheet exists, create if needed
        sheet_name = config['sheet_config']['name']
        sheet_exists = await check_sheet_exists(service, spreadsheet_id, sheet_name)
        
        if not sheet_exists and config['sheet_config']['auto_create']:
            await create_sheet_with_headers(service, spreadsheet_id, sheet_name, header_row)
        
        # Append the data
        range_name = f"{sheet_name}!A:Z"
        service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body={'values': [row_data]}
        ).execute()
        
        return {
            "success": True,
            "message": "User data stored successfully in Google Sheets",
            "data_stored": filtered_data
        }
        
    except HttpError as e:
        raise HTTPException(status_code=500, detail=f"Google Sheets API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store user data: {str(e)}")

@router.get("/user-data-config")
async def get_user_data_config_endpoint():
    """Get the current user data configuration."""
    return get_user_data_config()

@router.put("/user-data-config")
async def update_user_data_config(new_config: Dict[str, Any]):
    """Update the user data configuration (for flexibility)."""
    # In a real application, you might want to save this to a database
    # For now, we'll just return the updated config
    return {
        "success": True,
        "message": "Configuration updated",
        "config": new_config
    }
