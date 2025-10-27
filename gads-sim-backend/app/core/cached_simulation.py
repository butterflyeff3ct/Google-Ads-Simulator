"""
Cached Simulation Service

This module provides cached simulation services that ensure
deterministic, reproducible results.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.deterministic_cache import (
    cache_simulation_result, get_cached_simulation, 
    invalidate_simulation_cache, get_cache_stats
)
from app.core.enhanced_auction import simulate_volume_based_auctions
from app.core.hybrid_volume_estimation import hybrid_volume_engine

logger = logging.getLogger(__name__)

class CachedSimulationService:
    """
    Service for cached, deterministic simulations
    
    Features:
    - Configuration-based caching
    - Deterministic results
    - Cache statistics
    - Reproducible simulations
    """
    
    def __init__(self):
        self.cache_enabled = True
        logger.info("CachedSimulationService initialized")
    
    def _create_simulation_config(
        self,
        keywords: List[Dict[str, Any]],
        geo: str,
        campaign_context: Optional[Dict[str, Any]] = None,
        seed: int = 12345,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create normalized configuration for caching
        
        Args:
            keywords: List of keyword dictionaries
            geo: Geographic targeting
            campaign_context: Campaign context
            seed: Random seed
            **kwargs: Additional parameters
            
        Returns:
            Normalized configuration dictionary
        """
        # Normalize keywords (sort by text for consistency)
        normalized_keywords = sorted(keywords, key=lambda k: k['text'])
        
        config = {
            'keywords': normalized_keywords,
            'geo': geo,
            'campaign_context': campaign_context or {},
            'seed': seed,
            **kwargs
        }
        
        return config
    
    def run_cached_simulation(
        self,
        keywords: List[Dict[str, Any]],
        geo: str = 'US',
        campaign_context: Optional[Dict[str, Any]] = None,
        seed: int = 12345,
        use_cache: bool = True,
        cache_ttl_hours: int = 24,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run simulation with caching for deterministic results
        
        Args:
            keywords: List of keyword dictionaries
            geo: Geographic targeting
            campaign_context: Campaign context
            seed: Random seed for reproducibility
            use_cache: Whether to use cache
            cache_ttl_hours: Cache TTL in hours
            **kwargs: Additional simulation parameters
            
        Returns:
            Simulation results with cache metadata
        """
        # Create normalized configuration
        config = self._create_simulation_config(
            keywords=keywords,
            geo=geo,
            campaign_context=campaign_context,
            seed=seed,
            **kwargs
        )
        
        # Check cache first
        if use_cache and self.cache_enabled:
            cached_result = get_cached_simulation(config)
            if cached_result is not None:
                logger.info("Returning cached simulation result")
                return {
                    **cached_result,
                    'cache_hit': True,
                    'cache_key': cached_result.get('cache_key'),
                    'cached_at': cached_result.get('cached_at')
                }
        
        # Run fresh simulation
        logger.info("Running fresh simulation")
        try:
            # Run the enhanced auction simulation
            results = simulate_volume_based_auctions(
                keywords=keywords,
                geo=geo,
                campaign_context=campaign_context,
                seed=seed
            )
            
            # Prepare result with metadata
            simulation_result = {
                'results': results,
                'config': config,
                'cache_hit': False,
                'simulated_at': datetime.now().isoformat(),
                'seed': seed,
                'geo': geo,
                'total_keywords': len(keywords)
            }
            
            # Cache the result
            if use_cache and self.cache_enabled:
                cache_key = cache_simulation_result(
                    config, simulation_result, cache_ttl_hours
                )
                simulation_result['cache_key'] = cache_key
                simulation_result['cached_at'] = datetime.now().isoformat()
                logger.info(f"Cached simulation result with key: {cache_key[:16]}...")
            
            return simulation_result
            
        except Exception as e:
            logger.error(f"Simulation failed: {e}")
            raise
    
    def run_reproducible_simulation(
        self,
        keywords: List[Dict[str, Any]],
        geo: str = 'US',
        campaign_context: Optional[Dict[str, Any]] = None,
        seed: int = 12345,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run simulation with guaranteed reproducibility
        
        Args:
            keywords: List of keyword dictionaries
            geo: Geographic targeting
            campaign_context: Campaign context
            seed: Random seed
            **kwargs: Additional parameters
            
        Returns:
            Reproducible simulation results
        """
        return self.run_cached_simulation(
            keywords=keywords,
            geo=geo,
            campaign_context=campaign_context,
            seed=seed,
            use_cache=True,
            cache_ttl_hours=168,  # 7 days for reproducible results
            **kwargs
        )
    
    def invalidate_cache(self, config: Dict[str, Any]) -> bool:
        """
        Invalidate cache for specific configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if cache was invalidated
        """
        return invalidate_simulation_cache(config)
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = get_cache_stats()
        return {
            **stats,
            'cache_enabled': self.cache_enabled,
            'service_status': 'active'
        }
    
    def enable_cache(self):
        """Enable caching"""
        self.cache_enabled = True
        logger.info("Cache enabled")
    
    def disable_cache(self):
        """Disable caching"""
        self.cache_enabled = False
        logger.info("Cache disabled")

# Global service instance
cached_simulation_service = CachedSimulationService()

def run_deterministic_simulation(
    keywords: List[Dict[str, Any]],
    geo: str = 'US',
    campaign_context: Optional[Dict[str, Any]] = None,
    seed: int = 12345,
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Run deterministic simulation with caching
    
    Args:
        keywords: List of keyword dictionaries
        geo: Geographic targeting
        campaign_context: Campaign context
        seed: Random seed
        use_cache: Whether to use cache
        
    Returns:
        Simulation results
    """
    return cached_simulation_service.run_cached_simulation(
        keywords=keywords,
        geo=geo,
        campaign_context=campaign_context,
        seed=seed,
        use_cache=use_cache
    )

def run_reproducible_simulation(
    keywords: List[Dict[str, Any]],
    geo: str = 'US',
    campaign_context: Optional[Dict[str, Any]] = None,
    seed: int = 12345
) -> Dict[str, Any]:
    """
    Run reproducible simulation (always cached)
    
    Args:
        keywords: List of keyword dictionaries
        geo: Geographic targeting
        campaign_context: Campaign context
        seed: Random seed
        
    Returns:
        Reproducible simulation results
    """
    return cached_simulation_service.run_reproducible_simulation(
        keywords=keywords,
        geo=geo,
        campaign_context=campaign_context,
        seed=seed
    )

def get_simulation_cache_stats() -> Dict[str, Any]:
    """Get simulation cache statistics"""
    return cached_simulation_service.get_cache_statistics()
