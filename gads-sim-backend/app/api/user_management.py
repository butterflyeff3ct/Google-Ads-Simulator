"""
SQL Server-based User Management API
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.services.database_service import UserService, UserActivityService
from app.models import User, UserActivity

router = APIRouter()

# Pydantic models for API
class UserData(BaseModel):
    id: str
    name: str
    email: str
    image: Optional[str] = None
    provider: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None

class UserActivityData(BaseModel):
    user_id: str
    email: str
    session_id: str
    login_time: str
    logout_time: Optional[str] = None
    status: str = "active"
    duration_mins: int = 0
    page_views: int = 0
    actions_taken: List[str] = []
    ip_address: str = "unknown"
    last_activity: Optional[str] = None
    idle_timeout: int = 15

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    provider: str
    profile_pic: Optional[str]
    status: str
    signup_timestamp: datetime
    first_login: Optional[datetime]
    last_login: Optional[datetime]
    approval_date: Optional[datetime]

class ActivityResponse(BaseModel):
    id: str
    user_id: str
    session_id: str
    login_time: datetime
    logout_time: Optional[datetime]
    status: str
    duration_mins: int
    page_views: int
    actions_taken: List[str]
    ip_address: Optional[str]
    last_activity: Optional[datetime]

@router.post("/store-user-sql")
async def store_user(user_data: UserData):
    """Store user data in SQL Server database"""
    try:
        # Check if user already exists
        existing_user = UserService.get_user_by_email(user_data.email)
        
        if existing_user:
            # Update last login
            updated_user = UserService.update_user_login(existing_user["id"])
            user_action = "updated_login"
        else:
            # Create new user
            updated_user = UserService.create_user(
                email=user_data.email,
                name=user_data.name,
                provider=user_data.provider,
                profile_pic=user_data.image
            )
            user_action = "created_user"
        
        # Create activity record
        session_id = f"sess-{updated_user['id']}-{int(datetime.utcnow().timestamp())}"
        activity = UserActivityService.create_activity(
            user_id=updated_user["id"],
            session_id=session_id,
            login_time=datetime.utcnow(),
            ip_address="unknown"  # Could be extracted from request
        )
        
        return {
            "success": True,
            "message": f"User {user_data.name} processed successfully",
            "session_id": session_id,
            "user_action": user_action,
            "user_id": updated_user["id"],
            "data_stored": {
                "user_id": updated_user["id"],
                "email": updated_user["email"],
                "session_id": session_id,
                "login_time": activity["login_time"].isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error storing user data: {str(e)}"
        )

# Disabled - now handled by unified_user_tracking.py with simpler heartbeat model
# @router.post("/update-user-activity")
# async def update_user_activity(activity_data: UserActivityData):
#     """Update user activity in SQL Server database"""
#     try:
#         # Parse datetime strings
#         login_time = datetime.fromisoformat(activity_data.login_time.replace('Z', '+00:00'))
#         logout_time = None
#         if activity_data.logout_time:
#             logout_time = datetime.fromisoformat(activity_data.logout_time.replace('Z', '+00:00'))
#         
#         last_activity = None
#         if activity_data.last_activity:
#             last_activity = datetime.fromisoformat(activity_data.last_activity.replace('Z', '+00:00'))
#         
#         # Update activity
#         updated_activity = UserActivityService.update_activity(
#             session_id=activity_data.session_id,
#             page_views=activity_data.page_views,
#             actions_taken=activity_data.actions_taken,
#             status=activity_data.status,
#             logout_time=logout_time
#         )
#         
#         if not updated_activity:
#             # Create new activity if session not found
#             activity = UserActivityService.create_activity(
#                 user_id=activity_data.user_id,
#                 session_id=activity_data.session_id,
#                 login_time=login_time,
#                 ip_address=activity_data.ip_address
#             )
#             
#             return {
#                 "success": True,
#                 "message": f"New activity record created for session {activity_data.session_id}",
#                 "data_stored": activity_data.dict()
#             }
#         
#         return {
#             "success": True,
#             "message": f"Activity updated for session {activity_data.session_id}",
#             "updated_data": activity_data.dict()
#         }
#         
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error updating user activity: {str(e)}"
#         )

@router.get("/get-users")
async def get_users(limit: int = 100, offset: int = 0):
    """Get all users from SQL Server database"""
    try:
        users = UserService.get_all_users(limit=limit, offset=offset)
        
        user_list = []
        for user in users:
            user_list.append({
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "status": user.status,
                "signup_timestamp": user.signup_timestamp.isoformat() if user.signup_timestamp else "",
                "first_login": user.first_login.isoformat() if user.first_login else "",
                "last_login": user.last_login.isoformat() if user.last_login else "",
                "approval_date": user.approval_date.isoformat() if user.approval_date else "",
                "denial_reason": user.denial_reason or "",
                "reapply_count": user.reapply_count,
                "added_by": user.added_by,
                "notes": user.notes or "",
                "profile_pic": user.profile_pic or ""
            })
        
        return {"users": user_list}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/get-user-activities")
async def get_user_activities(user_id: Optional[str] = None, limit: int = 50):
    """Get user activities from SQL Server database"""
    try:
        if user_id:
            activities = UserActivityService.get_user_activities(user_id, limit=limit)
        else:
            activities = UserActivityService.get_active_sessions()
        
        activity_list = []
        for activity in activities:
            activity_list.append({
                "id": activity.id,
                "user_id": activity.user_id,
                "email": activity.user.email if activity.user else "",
                "session_id": activity.session_id,
                "login_time": activity.login_time.isoformat(),
                "logout_time": activity.logout_time.isoformat() if activity.logout_time else "",
                "status": activity.status,
                "duration_mins": activity.duration_mins,
                "page_views": activity.page_views,
                "actions_taken": activity.actions_taken or [],
                "ip_address": activity.ip_address or "",
                "last_activity": activity.last_activity.isoformat() if activity.last_activity else "",
                "idle_timeout": activity.idle_timeout
            })
        
        return {"activities": activity_list}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching activities: {str(e)}"
        )

@router.get("/get-user/{user_id}")
async def get_user(user_id: str):
    """Get specific user by ID"""
    try:
        user = UserService.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "provider": user.provider,
            "profile_pic": user.profile_pic,
            "status": user.status,
            "signup_timestamp": user.signup_timestamp.isoformat(),
            "first_login": user.first_login.isoformat() if user.first_login else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "approval_date": user.approval_date.isoformat() if user.approval_date else None,
            "notes": user.notes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user: {str(e)}"
        )

@router.get("/check-user-exists")
async def check_user_exists(email: str):
    """Check if user exists in database"""
    try:
        user = UserService.get_user_by_email(email)
        
        if user:
            return {
                "exists": True,
                "message": "User found - allow login",
                "user_id": user.id,
                "user_data": {
                    "email": user.email,
                    "name": user.name,
                    "status": user.status,
                    "last_login": user.last_login.isoformat() if user.last_login else ""
                }
            }
        else:
            return {
                "exists": False,
                "message": "User not found - redirect to signup",
                "user_id": None
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking user existence: {str(e)}"
        )

# Disabled - now handled by unified_user_tracking.py
# @router.post("/log-user-login")
# async def log_user_login(user_data: UserData):
#     """Log user login - same as store_user but with different endpoint name for compatibility"""
#     return await store_user(user_data)

@router.get("/debug-activities-sql")
async def debug_activities_list():
    """Debug endpoint to see database activity data"""
    try:
        activities = UserActivityService.get_all_activities(limit=100)
        
        return {
            "total_activities": len(activities),
            "active_sessions": len([a for a in activities if a.get("status") == "active"]),
            "activities": [
                {
                    "id": activity["id"],
                    "user_id": activity["user_id"],
                    "session_id": activity["session_id"],
                    "login_time": str(activity["login_time"]) if activity["login_time"] else None,
                    "ip_address": activity["ip_address"],
                    "status": activity["status"],
                    "page_views": activity["page_views"],
                    "duration_mins": activity["duration_mins"]
                }
                for activity in activities
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching activities data: {str(e)}"
        )

@router.get("/debug-user-list-sql")
async def debug_user_list_sql(limit: int = 100, offset: int = 0):
    """Debug endpoint to list users from SQL for frontend viewer"""
    try:
        users = UserService.get_all_users(limit=limit, offset=offset)
        return {
            "total_users": len(users),
            "users": [
                {
                    "id": u["id"],
                    "email": u["email"],
                    "name": u["name"],
                    "status": u["status"],
                    "signup_timestamp": str(u["signup_timestamp"]) if u.get("signup_timestamp") else "",
                    "last_login": str(u["last_login"]) if u.get("last_login") else "",
                }
                for u in users
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users data: {str(e)}")
