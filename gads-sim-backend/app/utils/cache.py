"""
Caching Utilities

This module handles result caching using DiskCache
"""
from diskcache import Cache
import hashlib
import json
from typing import Any, Optional
from app.core.constants import CACHE_TTL_SECONDS

# Initialize cache
cache = Cache('./cache')


def generate_cache_key(data: dict, seed: int) -> str:
    """
    Generate a deterministic cache key from inputs
    
    Args:
        data: Input data dictionary
        seed: Random seed
        
    Returns:
        SHA256 hash as cache key
    """
    # Sort keys for deterministic serialization
    data_str = json.dumps(data, sort_keys=True)
    combined = f"{data_str}:{seed}"
    
    return hashlib.sha256(combined.encode()).hexdigest()


def get_cached_result(cache_key: str) -> Optional[Any]:
    """
    Retrieve cached result by key
    
    Args:
        cache_key: Cache key
        
    Returns:
        Cached value or None if not found
    """
    return cache.get(cache_key)


def set_cached_result(cache_key: str, result: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    """
    Store result in cache
    
    Args:
        cache_key: Cache key
        result: Result to cache
        ttl: Time to live in seconds
    """
    cache.set(cache_key, result, expire=ttl)


def clear_cache() -> None:
    """Clear all cached results"""
    cache.clear()


def get_cache_stats() -> dict:
    """
    Get cache statistics
    
    Returns:
        Dictionary with cache stats
    """
    return {
        "size": len(cache),
        "hits": cache.hits,
        "misses": cache.misses
    }
