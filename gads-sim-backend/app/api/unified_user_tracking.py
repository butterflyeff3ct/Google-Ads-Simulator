"""
Unified User Tracking - SQL Server only
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging

from app.services.database_service import UserService, UserActivityService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class UserData(BaseModel):
    user_id: str
    email: str
    name: str
    provider: str
    profile_pic: Optional[str] = None
    is_first_login: bool = True

class UserActivity(BaseModel):
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

def log_to_sql_server(user_data: UserData) -> dict:
    """Log user data to SQL Server"""
    try:
        # Check if user exists
        existing_user = UserService.get_user_by_email(user_data.email)
        
        if existing_user:
            # Update last login
            UserService.update_user_login(existing_user["id"])
            user_id = existing_user["id"]
            action = "updated_login"
        else:
            # Create new user
            new_user = UserService.create_user(
                email=user_data.email,
                name=user_data.name,
                provider=user_data.provider,
                profile_pic=user_data.profile_pic
            )
            user_id = new_user["id"]
            action = "created_user"
        
        # Create activity record
        session_id = f"sess-{user_id}-{int(datetime.utcnow().timestamp())}"
        UserActivityService.create_activity(
            user_id=user_id,
            session_id=session_id,
            login_time=datetime.utcnow(),
            ip_address="unknown"
        )
        
        logger.info(f"✅ SQL Server: User {user_data.email} logged successfully")
        return {"success": True, "session_id": session_id, "action": action, "user_id": user_id}

    except Exception as e:
        logger.error(f"❌ SQL Server logging failed: {str(e)}")
        return {"success": False, "error": str(e)}


@router.post("/log-user-login")
async def log_user_login(user_data: UserData):
    """Log user login to SQL Server only"""
    logger.info(f"🔄 Processing login for user: {user_data.email}")
    sql_result = log_to_sql_server(user_data)
    if sql_result.get("success"):
        return {
            "success": True,
            "message": f"User {user_data.name} logged successfully",
            "session_id": sql_result.get("session_id"),
            "sql_status": "success",
            "user_id": sql_result.get("user_id")
        }
    else:
        raise HTTPException(status_code=500, detail=sql_result.get("error", "SQL logging failed"))


@router.post("/check-user-exists")
async def check_user_exists(user_data: UserData):
    """Check if user exists in SQL Server only"""
    try:
        sql_user = UserService.get_user_by_email(user_data.email)
        
        if sql_user:
            return {
                "exists": True,
                "message": "User found in SQL Server",
                "source": "sql_server",
                "user_id": sql_user["id"],
                "user_data": {
                    "email": sql_user["email"],
                    "name": sql_user["name"],
                    "status": sql_user["status"]
                }
            }
        return {
            "exists": False,
            "message": "User not found",
            "user_id": user_data.user_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking user existence: {str(e)}"
        )


@router.get("/debug-user-data")
async def debug_user_data():
    """Debug endpoint to see data from SQL system"""
    try:
        sql_users = UserService.get_all_users(limit=10)
        sql_activities = UserActivityService.get_all_activities(limit=10)
        
        return {
            "sql_server": {
                "users_count": len(sql_users),
                "activities_count": len(sql_activities),
                "users": [{"id": u["id"], "email": u["email"], "name": u["name"]} for u in sql_users[:5]],
                "activities": [{"session_id": a["session_id"], "user_id": a["user_id"]} for a in sql_activities[:5]]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Debug error: {str(e)}"
        )


@router.get("/get-user-list")
async def get_user_list():
    """Get user list from SQL Server"""
    try:
        users = UserService.get_all_users(limit=100)
        
        user_list = []
        for user in users:
            user_list.append({
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "status": user["status"],
                "signup_timestamp": str(user["signup_timestamp"]) if user["signup_timestamp"] else "",
                "first_login": str(user["first_login"]) if user["first_login"] else "",
                "last_login": str(user["last_login"]) if user["last_login"] else "",
                "approval_date": str(user["approval_date"]) if user["approval_date"] else "",
                "added_by": user["added_by"],
                "notes": user["notes"] or "",
                "profile_pic": user["profile_pic"] or ""
            })
        
        logger.info(f"Retrieved {len(user_list)} users from SQL Server")
        return {"users": user_list}
        
    except Exception as e:
        logger.error(f"Error fetching users from SQL Server: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user list: {str(e)}"
        )


@router.get("/get-user-activity")
async def get_user_activity():
    """Get user activity from SQL Server"""
    try:
        activities = UserActivityService.get_all_activities(limit=100)
        
        activity_list = []
        for activity in activities:
            activity_list.append({
                "user_id": activity["user_id"],
                "email": activity.get("email", ""),
                "session_id": activity["session_id"],
                "login_time": str(activity["login_time"]) if activity["login_time"] else "",
                "logout_time": str(activity.get("logout_time")) if activity.get("logout_time") else "",
                "status": activity["status"],
                "duration_mins": activity["duration_mins"],
                "page_views": activity["page_views"],
                "actions_taken": [],
                "ip_address": activity.get("ip_address") or "",
                "last_activity": str(activity.get("last_activity")) if activity.get("last_activity") else "",
                "idle_timeout": activity["idle_timeout"]
            })
        
        logger.info(f"Retrieved {len(activity_list)} activities from SQL Server")
        return {"activities": activity_list}
        
    except Exception as e:
        logger.error(f"Error fetching activities from SQL Server: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user activity: {str(e)}"
        )


class UpdateActivityData(BaseModel):
    session_id: str
    page_views: Optional[int] = None
    actions_taken: Optional[list] = None
    status: Optional[str] = None


@router.post("/update-user-activity")
async def update_user_activity(activity_data: UpdateActivityData):
    """Update user activity heartbeat - keeps last_activity fresh"""
    try:
        result = UserActivityService.update_activity(
            session_id=activity_data.session_id,
            page_views=activity_data.page_views,
            actions_taken=activity_data.actions_taken,
            status=activity_data.status
        )
        
        if result:
            logger.info(f"✅ Activity updated for session {activity_data.session_id}")
            return {
                "success": True,
                "message": "Activity updated successfully",
                "session_id": activity_data.session_id
            }
        else:
            logger.warning(f"⚠️ Session not found: {activity_data.session_id}")
            return {
                "success": False,
                "message": "Session not found"
            }
        
    except Exception as e:
        logger.error(f"❌ Failed to update activity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error updating activity: {str(e)}"
        )


async def log_user_activity(activity_data: UserActivity):
    """Update user activity in both systems"""
    try:
        # Parse datetime strings
        login_time = datetime.fromisoformat(activity_data.login_time.replace('Z', '+00:00'))
        logout_time = None
        if activity_data.logout_time:
            logout_time = datetime.fromisoformat(activity_data.logout_time.replace('Z', '+00:00'))
        
        # Update SQL Server
        try:
            UserActivityService.update_activity(
                session_id=activity_data.session_id,
                page_views=activity_data.page_views,
                actions_taken=activity_data.actions_taken,
                status=activity_data.status,
                logout_time=logout_time
            )
            sql_status = "success"
        except Exception as e:
            logger.error(f"SQL Server activity update failed: {e}")
            sql_status = "failed"
        
        return {
            "success": True,
            "message": f"Activity logged for session {activity_data.session_id}",
            "sql_status": sql_status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error logging activity: {str(e)}"
        )
