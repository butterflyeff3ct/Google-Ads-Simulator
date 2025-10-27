from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.services.database_service import AccessRequestService, UserService

router = APIRouter()

class AccessRequestPayload(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    role: Optional[str] = None
    reason: Optional[str] = None
    message: Optional[str] = None

@router.post("/access-request")
async def submit_access_request(request: AccessRequestPayload):
    """Submit an access request for manual approval (SQL only)"""
    try:
        created = AccessRequestService.create_access_request(
            email=request.email,
            name=request.name,
            company=request.company,
            role=request.role,
            reason=request.reason,
            notes=request.message
        )
        return {
            "success": True,
            "message": "Access request submitted successfully",
            "request_id": created["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit access request: {str(e)}")

@router.get("/access-requests")
async def get_access_requests(status: Optional[str] = None):
    """Get access requests from SQL (optionally filtered by status)"""
    try:
        if status:
            items = AccessRequestService.get_requests_by_status(status)
        else:
            items = AccessRequestService.get_all_requests()
        return {
            "requests": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "email": r["email"],
                    "company": r["company"],
                    "role": r["role"],
                    "reason": r["reason"],
                    "message": r["notes"],
                    "status": r["status"],
                    "requested_at": str(r["requested_at"]) if r["requested_at"] else None,
                    "reviewed_at": str(r["reviewed_at"]) if r["reviewed_at"] else None,
                    "reviewed_by": r["reviewed_by"],
                    "notes": r["notes"]
                }
                for r in items
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve access requests: {str(e)}")

@router.put("/access-request/{request_id}/approve")
async def approve_access_request(request_id: str):
    """Approve an access request (SQL only)"""
    try:
        # Get the request first to retrieve email
        all_requests = AccessRequestService.get_all_requests()
        current_request = next((r for r in all_requests if r["id"] == request_id), None)
        
        if not current_request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Update status
        request = AccessRequestService.update_request_status(
            request_id=request_id,
            status="approved",
            reviewed_by="admin"
        )
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Create user if they don't exist, or update status if they do
        user = UserService.get_user_by_email(current_request["email"])
        if user:
            # User exists, just update status to active
            UserService.update_user_status(user["id"], "active")
        else:
            # User doesn't exist, create them
            UserService.create_user(
                email=current_request["email"],
                name=current_request["name"],
                provider="credentials",  # Default provider for access requests
                profile_pic=None
            )
        
        return {
            "success": True,
            "message": f"Request {request_id} approved and user created",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve request: {str(e)}")

@router.put("/access-request/{request_id}/reject")
async def reject_access_request(request_id: str):
    """Reject an access request (SQL only)"""
    try:
        request = AccessRequestService.update_request_status(
            request_id=request_id,
            status="rejected",
            reviewed_by="admin"
        )
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        return {
            "success": True,
            "message": f"Request {request_id} rejected",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject request: {str(e)}")

@router.get("/rejected-list")
async def get_rejected_list():
    """Get all rejected users from SQL only"""
    try:
        items = AccessRequestService.get_requests_by_status("rejected")
        return {
            "rejected_users": [
                {
                    "user_id": None,
                    "email": r.email,
                    "name": r.name,
                    "company": r.company,
                    "role": r.role,
                    "use_case": r.reason,
                    "experience": None,
                    "message": r.notes,
                    "rejection_date": r.reviewed_at.isoformat() if r.reviewed_at else None,
                    "rejected_by": r.reviewed_by,
                    "rejection_reason": r.notes
                }
                for r in items
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve rejected list: {str(e)}")
