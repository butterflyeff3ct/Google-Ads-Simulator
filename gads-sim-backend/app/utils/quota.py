"""
Simplified API Quota Management for AI Max
"""
from typing import Dict

# Simplified quota limits for AI Max only
QUOTA_LIMITS = {
    "gemini_tokens": 200000,  # Daily limit for Gemini API tokens
}

# In-memory quota tracking (simple demo implementation)
quota_usage: Dict[str, int] = {}


def check_quota_available(user_id: str, provider: str, required: int = 1) -> bool:
    """
    Check if user has quota available (simplified version)
    For demo purposes, always returns True to allow testing
    """
    # For demo/development, always allow
    return True


def increment_quota(user_id: str, provider: str, units: int = 1) -> int:
    """
    Track quota usage (simplified version)
    """
    key = f"{user_id}:{provider}"
    current = quota_usage.get(key, 0)
    quota_usage[key] = current + units
    return quota_usage[key]




def get_quota_status(user_id: str) -> Dict:
    """
    Get quota status for AI Max
    """
    key = f"{user_id}:gemini_tokens"
    usage = quota_usage.get(key, 0)
    limit = QUOTA_LIMITS["gemini_tokens"]
    
    return {
        "gemini_tokens": {
            "usage": usage,
            "limit": limit,
            "remaining": limit - usage,
            "available": usage < limit
        }
    }
