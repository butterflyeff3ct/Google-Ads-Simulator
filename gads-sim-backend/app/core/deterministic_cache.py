"""
Caching System for Deterministic Output

This module implements caching for simulation results to ensure
reproducible outputs and eliminate randomness.
"""

import hashlib
import json
import pickle
import time
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    key: str
    data: Any
    created_at: datetime
    expires_at: Optional[datetime] = None
    hit_count: int = 0
    last_accessed: datetime = None

class DeterministicCache:
    """
    Deterministic cache system for simulation results
    
    Features:
    - Configuration-based cache keys
    - TTL support
    - Hit tracking
    - Persistent storage
    - Cache statistics
    """
    
    def __init__(self, cache_dir: str = "cache/simulations", ttl_hours: int = 24):
        """
        Initialize the cache system
        
        Args:
            cache_dir: Directory for persistent cache storage
            ttl_hours: Time-to-live for cache entries in hours
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl_hours = ttl_hours
        self.memory_cache: Dict[str, CacheEntry] = {}
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_requests': 0
        }
        
        logger.info(f"DeterministicCache initialized with TTL: {ttl_hours}h")
    
    def _generate_config_hash(self, config: Dict[str, Any]) -> str:
        """
        Generate deterministic hash from configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            SHA256 hash string
        """
        # Sort keys for consistent hashing
        sorted_config = self._sort_config_recursive(config)
        
        # Convert to JSON string with sorted keys
        config_str = json.dumps(sorted_config, sort_keys=True, separators=(',', ':'))
        
        # Generate hash
        hash_obj = hashlib.sha256(config_str.encode('utf-8'))
        return hash_obj.hexdigest()
    
    def _sort_config_recursive(self, obj: Any) -> Any:
        """
        Recursively sort configuration for consistent hashing
        
        Args:
            obj: Configuration object
            
        Returns:
            Sorted configuration
        """
        if isinstance(obj, dict):
            return {k: self._sort_config_recursive(obj[k]) for k in sorted(obj.keys())}
        elif isinstance(obj, list):
            return [self._sort_config_recursive(item) for item in obj]
        else:
            return obj
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry is expired"""
        if entry.expires_at is None:
            return False
        return datetime.now() > entry.expires_at
    
    def _cleanup_expired(self):
        """Remove expired entries from memory cache"""
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if self._is_expired(entry)
        ]
        
        for key in expired_keys:
            del self.memory_cache[key]
            self.stats['evictions'] += 1
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    def get(self, config: Dict[str, Any]) -> Optional[Any]:
        """
        Get cached result for configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            Cached result or None if not found/expired
        """
        self.stats['total_requests'] += 1
        
        # Generate cache key
        cache_key = self._generate_config_hash(config)
        
        # Check memory cache first
        if cache_key in self.memory_cache:
            entry = self.memory_cache[cache_key]
            
            if not self._is_expired(entry):
                entry.hit_count += 1
                entry.last_accessed = datetime.now()
                self.stats['hits'] += 1
                logger.debug(f"Cache hit for key: {cache_key[:16]}...")
                return entry.data
            else:
                # Remove expired entry
                del self.memory_cache[cache_key]
                self.stats['evictions'] += 1
        
        # Check persistent cache
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    entry = pickle.load(f)
                
                if not self._is_expired(entry):
                    # Load back into memory cache
                    self.memory_cache[cache_key] = entry
                    entry.hit_count += 1
                    entry.last_accessed = datetime.now()
                    self.stats['hits'] += 1
                    logger.debug(f"Persistent cache hit for key: {cache_key[:16]}...")
                    return entry.data
                else:
                    # Remove expired file
                    cache_file.unlink()
                    self.stats['evictions'] += 1
            except Exception as e:
                logger.warning(f"Error loading cache file {cache_file}: {e}")
                cache_file.unlink()
        
        self.stats['misses'] += 1
        logger.debug(f"Cache miss for key: {cache_key[:16]}...")
        return None
    
    def set(self, config: Dict[str, Any], data: Any, custom_ttl_hours: Optional[int] = None) -> str:
        """
        Cache result for configuration
        
        Args:
            config: Configuration dictionary
            data: Result data to cache
            custom_ttl_hours: Custom TTL override
            
        Returns:
            Cache key
        """
        # Generate cache key
        cache_key = self._generate_config_hash(config)
        
        # Determine TTL
        ttl = custom_ttl_hours or self.ttl_hours
        expires_at = datetime.now() + timedelta(hours=ttl)
        
        # Create cache entry
        entry = CacheEntry(
            key=cache_key,
            data=data,
            created_at=datetime.now(),
            expires_at=expires_at,
            hit_count=0,
            last_accessed=datetime.now()
        )
        
        # Store in memory cache
        self.memory_cache[cache_key] = entry
        
        # Store in persistent cache
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(entry, f)
            logger.debug(f"Cached result with key: {cache_key[:16]}...")
        except Exception as e:
            logger.error(f"Error saving cache file {cache_file}: {e}")
        
        return cache_key
    
    def invalidate(self, config: Dict[str, Any]) -> bool:
        """
        Invalidate cache entry for configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if entry was found and removed
        """
        cache_key = self._generate_config_hash(config)
        
        removed = False
        
        # Remove from memory cache
        if cache_key in self.memory_cache:
            del self.memory_cache[cache_key]
            removed = True
        
        # Remove persistent file
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        if cache_file.exists():
            cache_file.unlink()
            removed = True
        
        if removed:
            logger.info(f"Invalidated cache entry: {cache_key[:16]}...")
        
        return removed
    
    def clear(self):
        """Clear all cache entries"""
        # Clear memory cache
        self.memory_cache.clear()
        
        # Clear persistent cache
        for cache_file in self.cache_dir.glob("*.pkl"):
            cache_file.unlink()
        
        # Reset stats
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_requests': 0
        }
        
        logger.info("Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        hit_rate = 0
        if self.stats['total_requests'] > 0:
            hit_rate = self.stats['hits'] / self.stats['total_requests']
        
        return {
            **self.stats,
            'hit_rate': hit_rate,
            'memory_entries': len(self.memory_cache),
            'persistent_files': len(list(self.cache_dir.glob("*.pkl")))
        }
    
    def cleanup(self):
        """Cleanup expired entries and optimize cache"""
        self._cleanup_expired()
        
        # Cleanup old persistent files
        cutoff_time = datetime.now() - timedelta(hours=self.ttl_hours * 2)
        cleaned_files = 0
        
        for cache_file in self.cache_dir.glob("*.pkl"):
            try:
                if cache_file.stat().st_mtime < cutoff_time.timestamp():
                    cache_file.unlink()
                    cleaned_files += 1
            except Exception as e:
                logger.warning(f"Error checking file {cache_file}: {e}")
        
        if cleaned_files > 0:
            logger.info(f"Cleaned up {cleaned_files} old persistent cache files")

# Global cache instance
simulation_cache = DeterministicCache()

def cache_simulation_result(config: Dict[str, Any], result: Any, ttl_hours: int = 24) -> str:
    """
    Cache simulation result with configuration hash
    
    Args:
        config: Configuration dictionary
        result: Simulation result
        ttl_hours: Time-to-live in hours
        
    Returns:
        Cache key
    """
    return simulation_cache.set(config, result, ttl_hours)

def get_cached_simulation(config: Dict[str, Any]) -> Optional[Any]:
    """
    Get cached simulation result
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Cached result or None
    """
    return simulation_cache.get(config)

def invalidate_simulation_cache(config: Dict[str, Any]) -> bool:
    """
    Invalidate cached simulation result
    
    Args:
        config: Configuration dictionary
        
    Returns:
        True if entry was removed
    """
    return simulation_cache.invalidate(config)

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    return simulation_cache.get_stats()

def clear_simulation_cache():
    """Clear all simulation cache"""
    simulation_cache.clear()

def cleanup_simulation_cache():
    """Cleanup expired cache entries"""
    simulation_cache.cleanup()
