from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

router = APIRouter()

class UserData(BaseModel):
    id: str
    name: str = None
    email: str = None
    image: str = None
    provider: str
    accessToken: str = None
    refreshToken: str = None

class UserActivityData(BaseModel):
    user_id: str
    email: str
    session_id: str
    login_time: str
    logout_time: str = None
    status: str = "active"
    duration_mins: int = 0
    page_views: int = 0
    actions_taken: list = []
    ip_address: str = "unknown"
    last_activity: str = None
    idle_timeout: int = 15

def get_or_create_sheet(service, spreadsheet_id, sheet_name, headers):
    """Helper function to get or create a sheet with headers"""
    spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    sheets = spreadsheet.get('sheets', [])
    sheet_exists = any(sheet['properties']['title'] == sheet_name for sheet in sheets)
    
    if not sheet_exists:
        # Create sheet
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
    
    return True

@router.post("/store-user-simple")
async def store_user_simple(user_data: UserData):
    """Store user data in both Users and User Activity sheets"""
    try:
        # Hardcoded values for your setup
        credentials_file = "service-account-credentials.json"
        spreadsheet_id = "1rfIMS8YySdI0yOrsIHKj8Md80amZqarjzL5AYG4Dsts"
        
        # Load credentials
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        # Build service
        service = build('sheets', 'v4', credentials=credentials)
        
        # Generate session ID
        session_id = f"sess-{user_data.id}-{int(datetime.now().timestamp())}"
        current_time = datetime.now().isoformat()
        
        # 1. Store in Users sheet (User List)
        users_headers = [
            "User ID", "Email", "Name", "Status", "Signup Timestamp", 
            "First Login", "Last Login", "Approval Date", "Denial Reason", 
            "Reapply Count", "Added By", "Notes", "Profile Pic"
        ]
        
        get_or_create_sheet(service, spreadsheet_id, "Users", users_headers)
        
        # Check if user already exists in Users sheet
        try:
            # Get existing data to check if user exists
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="Users!A:B"
            ).execute()
            
            existing_users = result.get('values', [])
            user_exists = any(row[1] == user_data.email for row in existing_users[1:] if len(row) > 1)
            
            if not user_exists:
                # New user - add to Users sheet
                users_row_data = [
                    user_data.id,
                    user_data.email,
                    user_data.name,
                    "active",
                    current_time,  # Signup Timestamp
                    current_time,  # First Login
                    current_time,  # Last Login
                    current_time,  # Approval Date
                    "",  # Denial Reason
                    0,  # Reapply Count
                    "system",  # Added By
                    f"Auto-approved via {user_data.provider}",  # Notes
                    user_data.image or ""  # Profile Pic
                ]
                
                service.spreadsheets().values().append(
                    spreadsheetId=spreadsheet_id,
                    range='Users!A:M',
                    valueInputOption='RAW',
                    body={'values': [users_row_data]}
                ).execute()
                
                print(f"New user {user_data.name} added to Users sheet")
            else:
                # Existing user - update last login
                # Find the row and update last login
                for i, row in enumerate(existing_users[1:], start=2):  # Skip header
                    if len(row) > 1 and row[1] == user_data.email:
                        # Update last login
                        service.spreadsheets().values().update(
                            spreadsheetId=spreadsheet_id,
                            range=f"Users!G{i}",
                            valueInputOption='RAW',
                            body={'values': [[current_time]]}
                        ).execute()
                        print(f"Updated last login for existing user {user_data.name}")
                        break
                        
        except Exception as e:
            print(f"Error checking existing users: {e}")
            # If we can't check, just add the user
            users_row_data = [
                user_data.id,
                user_data.email,
                user_data.name,
                "active",
                current_time,
                current_time,
                current_time,
                current_time,
                "",
                0,
                "system",
                f"Auto-approved via {user_data.provider}",
                user_data.image or ""
            ]
            
            service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range='Users!A:M',
                valueInputOption='RAW',
                body={'values': [users_row_data]}
            ).execute()
        
        # 2. Store in User Activity sheet
        activity_headers = [
            "User ID", "Email", "Session ID", "Login Time", "Logout Time", 
            "Status", "Duration (mins)", "Page Views", "Actions Taken", 
            "IP Address", "Last Activity", "Idle Timeout"
        ]
        
        get_or_create_sheet(service, spreadsheet_id, "User Activity", activity_headers)
        
        # Add activity record
        activity_row_data = [
            user_data.id,
            user_data.email,
            session_id,
            current_time,  # Login Time
            "",  # Logout Time (empty for active session)
            "active",  # Status
            0,  # Duration (mins) - will be updated on logout
            1,  # Page Views - starts with 1 for login
            "login",  # Actions Taken
            "unknown",  # IP Address
            current_time,  # Last Activity
            15  # Idle Timeout
        ]
        
        service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range='User Activity!A:L',
            valueInputOption='RAW',
            body={'values': [activity_row_data]}
        ).execute()
        
        return {
            "success": True,
            "message": f"User {user_data.name} logged successfully",
            "session_id": session_id,
            "data_stored": {
                "user_id": user_data.id,
                "email": user_data.email,
                "session_id": session_id,
                "login_time": current_time
            }
        }
        
    except HttpError as e:
        error_details = e.error_details if hasattr(e, 'error_details') else str(e)
        raise HTTPException(
            status_code=500, 
            detail=f"Google Sheets API error: {error_details}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error storing user data: {str(e)}"
        )

# Disabled - Google Sheets deprecated, now handled by unified_user_tracking.py
"""
@router.post("/update-user-activity")
async def update_user_activity(activity_data: UserActivityData):
    # Update user activity in Google Sheets
    try:
        # Hardcoded values for your setup
        credentials_file = "service-account-credentials.json"
        spreadsheet_id = "1rfIMS8YySdI0yOrsIHKj8Md80amZqarjzL5AYG4Dsts"
        
        # Load credentials
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        # Build service
        service = build('sheets', 'v4', credentials=credentials)
        
        # Get User Activity sheet data to find the session
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="User Activity!A:L"
            ).execute()
            
            existing_activities = result.get('values', [])
            
            # Find the session to update
            for i, row in enumerate(existing_activities[1:], start=2):  # Skip header
                if len(row) > 2 and row[2] == activity_data.session_id:  # Session ID is column C
                    # Update the activity record
                    update_data = [
                        activity_data.user_id,
                        activity_data.email,
                        activity_data.session_id,
                        activity_data.login_time,
                        activity_data.logout_time or "",
                        activity_data.status,
                        activity_data.duration_mins,
                        activity_data.page_views,
                        ",".join(activity_data.actions_taken) if activity_data.actions_taken else "",
                        activity_data.ip_address,
                        activity_data.last_activity or activity_data.login_time,
                        activity_data.idle_timeout
                    ]
                    
                    # Update the entire row
                    range_name = f"User Activity!A{i}:L{i}"
                    service.spreadsheets().values().update(
                        spreadsheetId=spreadsheet_id,
                        range=range_name,
                        valueInputOption='RAW',
                        body={'values': [update_data]}
                    ).execute()
                    
                    return {
                        "success": True,
                        "message": f"Activity updated for session {activity_data.session_id}",
                        "updated_data": activity_data.dict()
                    }
            
            # If session not found, add new activity record
            activity_headers = [
                "User ID", "Email", "Session ID", "Login Time", "Logout Time", 
                "Status", "Duration (mins)", "Page Views", "Actions Taken", 
                "IP Address", "Last Activity", "Idle Timeout"
            ]
            
            get_or_create_sheet(service, spreadsheet_id, "User Activity", activity_headers)
            
            activity_row_data = [
                activity_data.user_id,
                activity_data.email,
                activity_data.session_id,
                activity_data.login_time,
                activity_data.logout_time or "",
                activity_data.status,
                activity_data.duration_mins,
                activity_data.page_views,
                ",".join(activity_data.actions_taken) if activity_data.actions_taken else "",
                activity_data.ip_address,
                activity_data.last_activity or activity_data.login_time,
                activity_data.idle_timeout
            ]
            
            service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range='User Activity!A:L',
                valueInputOption='RAW',
                body={'values': [activity_row_data]}
            ).execute()
            
            return {
                "success": True,
                "message": f"New activity record created for session {activity_data.session_id}",
                "data_stored": activity_data.dict()
            }
            
        except Exception as e:
            print(f"Error updating activity: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error updating user activity: {str(e)}"
            )
        
    except HttpError as e:
        error_details = e.error_details if hasattr(e, 'error_details') else str(e)
        raise HTTPException(
            status_code=500, 
            detail=f"Google Sheets API error: {error_details}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating user activity: {str(e)}"
        )
"""

@router.get("/get-users")
async def get_users():
    """Get all users from Google Sheets"""
    try:
        credentials_file = "service-account-credentials.json"
        spreadsheet_id = "1rfIMS8YySdI0yOrsIHKj8Md80amZqarjzL5AYG4Dsts"
        
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="Users!A:M"
            ).execute()
            
            rows = result.get('values', [])
            if len(rows) <= 1:  # Only headers or empty
                return {"users": []}
            
            users = []
            headers = rows[0]
            
            for row in rows[1:]:
                if len(row) >= 3:  # At least User ID, Email, Name
                    user = {
                        "user_id": row[0] if len(row) > 0 else "",
                        "email": row[1] if len(row) > 1 else "",
                        "name": row[2] if len(row) > 2 else "",
                        "status": row[3] if len(row) > 3 else "active",
                        "signup_timestamp": row[4] if len(row) > 4 else "",
                        "first_login": row[5] if len(row) > 5 else "",
                        "last_login": row[6] if len(row) > 6 else "",
                        "approval_date": row[7] if len(row) > 7 else "",
                        "denial_reason": row[8] if len(row) > 8 else "",
                        "reapply_count": int(row[9]) if len(row) > 9 and row[9].isdigit() else 0,
                        "added_by": row[10] if len(row) > 10 else "",
                        "notes": row[11] if len(row) > 11 else "",
                        "profile_pic": row[12] if len(row) > 12 else ""
                    }
                    users.append(user)
            
            return {"users": users}
            
        except Exception as e:
            print(f"Error fetching users: {e}")
            return {"users": []}
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/get-user-activities")
async def get_user_activities():
    """Get all user activities from Google Sheets"""
    try:
        credentials_file = "service-account-credentials.json"
        spreadsheet_id = "1rfIMS8YySdI0yOrsIHKj8Md80amZqarjzL5AYG4Dsts"
        
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="User Activity!A:L"
            ).execute()
            
            rows = result.get('values', [])
            if len(rows) <= 1:  # Only headers or empty
                return {"activities": []}
            
            activities = []
            
            for row in rows[1:]:
                if len(row) >= 3:  # At least User ID, Email, Session ID
                    activity = {
                        "user_id": row[0] if len(row) > 0 else "",
                        "email": row[1] if len(row) > 1 else "",
                        "session_id": row[2] if len(row) > 2 else "",
                        "login_time": row[3] if len(row) > 3 else "",
                        "logout_time": row[4] if len(row) > 4 else "",
                        "status": row[5] if len(row) > 5 else "active",
                        "duration_mins": int(row[6]) if len(row) > 6 and row[6].isdigit() else 0,
                        "page_views": int(row[7]) if len(row) > 7 and row[7].isdigit() else 0,
                        "actions_taken": row[8].split(",") if len(row) > 8 and row[8] else [],
                        "ip_address": row[9] if len(row) > 9 else "",
                        "last_activity": row[10] if len(row) > 10 else "",
                        "idle_timeout": int(row[11]) if len(row) > 11 and row[11].isdigit() else 15
                    }
                    activities.append(activity)
            
            return {"activities": activities}
            
        except Exception as e:
            print(f"Error fetching activities: {e}")
            return {"activities": []}
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching activities: {str(e)}"
        )
