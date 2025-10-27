"""
Enhanced Volume Estimation Engine with Google Ads API Integration

This module provides volume estimation with Google Ads API integration:
1. Uses Google Ads API for live volume data when available
2. Falls back to static data for offline simulations
3. Caches API responses for performance
4. Provides consistent interface regardless of data source
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Import Google Ads API integration
try:
    from app.services.google_ads_service import GoogleAdsKeywordService
    GOOGLE_ADS_AVAILABLE = True
except ImportError:
    GOOGLE_ADS_AVAILABLE = False

# Import static volume engine as fallback
from app.core.volume_estimation import VolumeEstimationEngine, VolumeData, AuctionEstimate

logger = logging.getLogger(__name__)

class HybridVolumeEstimationEngine:
    """
    Hybrid volume estimation engine that uses Google Ads API when available
    and falls back to static data for offline simulations
    """
    
    def __init__(self, use_google_ads_api: bool = True):
        """
        Initialize hybrid volume estimation engine
        
        Args:
            use_google_ads_api: Whether to use Google Ads API when available
        """
        self.use_google_ads_api = use_google_ads_api and GOOGLE_ADS_AVAILABLE
        self.static_engine = VolumeEstimationEngine()
        
        if self.use_google_ads_api:
            try:
                self.google_ads_service = GoogleAdsKeywordService()
                logger.info("Hybrid volume engine initialized with Google Ads API support")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Ads API: {e}")
                self.use_google_ads_api = False
                self.google_ads_service = None
        else:
            self.google_ads_service = None
            logger.info("Hybrid volume engine initialized with static data only")
    
    def estimate_daily_auctions(self, keyword: str, match_type: str, geo: str) -> AuctionEstimate:
        """
        Estimate daily auctions for a keyword using the best available data source
        
        Args:
            keyword: The keyword to estimate
            match_type: exact, phrase, or broad
            geo: Geographic targeting
            
        Returns:
            AuctionEstimate with daily auctions and metadata
        """
        # Try Google Ads API first if available
        if self.use_google_ads_api and self.google_ads_service:
            try:
                # Convert geo string to geo target constant ID
                geo_id = self._get_geo_target_id(geo)
                
                # Get historical metrics from Google Ads API
                metrics = self.google_ads_service.get_historical_metrics([keyword], location=geo_id)
                if metrics and len(metrics) > 0:
                    metric = metrics[0]
                    
                    # Get modifiers
                    match_modifier = self.static_engine.match_type_modifiers.get(match_type, 0.5)
                    geo_modifier = self.static_engine.geo_modifiers.get(geo, self.static_engine.geo_modifiers['default'])
                    
                    # Calculate daily auctions
                    monthly_searches = metric.get('avg_monthly_searches', 0)
                    daily_auctions = int((monthly_searches / 30) * match_modifier * geo_modifier)
                    daily_auctions = max(1, daily_auctions)
                    
                    return AuctionEstimate(
                        keyword=keyword,
                        match_type=match_type,
                        daily_auctions=daily_auctions,
                        volume_source='google_ads_api',
                        confidence=0.95  # High confidence for API data
                    )
            except Exception as e:
                logger.warning(f"Google Ads API failed for keyword '{keyword}': {e}")
        
        # Fall back to static engine
        return self.static_engine.estimate_daily_auctions(keyword, match_type, geo)
    
    def get_volume_data(self, keyword: str) -> Optional[VolumeData]:
        """
        Get volume data for a keyword using the best available data source
        
        Args:
            keyword: The keyword to get data for
            
        Returns:
            VolumeData if available, None otherwise
        """
        # Try Google Ads API first if available
        if self.use_google_ads_api and self.google_ads_service:
            try:
                metrics = self.google_ads_service.get_historical_metrics([keyword])
                if metrics and len(metrics) > 0:
                    metric = metrics[0]
                    
                    # Convert Google Ads data to VolumeData format
                    return VolumeData(
                        keyword=metric.get('keyword', keyword),
                        monthly_searches=metric.get('avg_monthly_searches', 0),
                        competition=metric.get('competition', 'Medium'),
                        competition_index=metric.get('competition_index', 50),
                        avg_cpc=(metric.get('low_top_of_page_bid_micros', 0) + metric.get('high_top_of_page_bid_micros', 0)) / 2_000_000,
                        cpc_low=metric.get('low_top_of_page_bid_micros', 0) / 1_000_000,
                        cpc_high=metric.get('high_top_of_page_bid_micros', 0) / 1_000_000
                    )
            except Exception as e:
                logger.warning(f"Google Ads API failed for keyword '{keyword}': {e}")
        
        # Fall back to static engine
        return self.static_engine.get_volume_data(keyword)
    
    def get_competition_level(self, keyword: str) -> str:
        """Get competition level for a keyword"""
        volume_data = self.get_volume_data(keyword)
        if volume_data:
            return volume_data.competition
        
        # Fall back to static engine estimation
        return self.static_engine.get_competition_level(keyword)
    
    def get_estimated_cpc(self, keyword: str, match_type: str) -> Tuple[float, float, float]:
        """Get estimated CPC range for a keyword"""
        volume_data = self.get_volume_data(keyword)
        if volume_data:
            # Apply match type modifiers to CPC
            if match_type == 'exact':
                cpc_multiplier = 1.2
            elif match_type == 'phrase':
                cpc_multiplier = 1.0
            else:  # broad
                cpc_multiplier = 0.8
            
            return (
                volume_data.cpc_low * cpc_multiplier,
                volume_data.avg_cpc * cpc_multiplier,
                volume_data.cpc_high * cpc_multiplier
            )
        
        # Fall back to static engine estimation
        return self.static_engine.get_estimated_cpc(keyword, match_type)
    
    def get_keyword_suggestions(self, seed_keyword: str, max_suggestions: int = 10) -> List[VolumeData]:
        """Get keyword suggestions based on seed keyword"""
        # For now, use static engine for suggestions
        # In the future, this could use Google Ads API keyword suggestions
        return self.static_engine.get_keyword_suggestions(seed_keyword, max_suggestions)
    
    def get_keyword_forecast(
        self,
        keywords: List[str],
        campaign_budget: float,
        geo: str = 'US',
        language: str = 'en'
    ) -> Dict[str, any]:
        """
        Get keyword forecast data using the best available data source
        
        Args:
            keywords: List of keywords to forecast
            campaign_budget: Daily campaign budget
            geo: Geographic targeting
            language: Language targeting
            
        Returns:
            Forecast data including impressions, clicks, cost, conversions
        """
        # Try Google Ads API first if available
        if self.use_google_ads_api and self.google_ads_service:
            try:
                # Convert geo string to geo target constant ID
                geo_id = self._get_geo_target_id(geo)
                forecast = self.google_ads_service.get_forecast_metrics(keywords, campaign_budget, location=geo_id)
                return forecast
            except Exception as e:
                logger.warning(f"Google Ads API forecast failed: {e}")
        
        # Fall back to static engine estimation
        forecast_data = {
            'keywords': [],
            'campaign_forecast': {
                'total_impressions': 0,
                'total_clicks': 0,
                'total_cost': 0,
                'total_conversions': 0,
                'avg_ctr': 0,
                'avg_cvr': 0
            },
            'budget_utilization': 0,
            'cached': False,
            'source': 'static'
        }
        
        total_impressions = 0
        total_clicks = 0
        total_cost = 0
        total_conversions = 0
        
        for keyword in keywords:
            volume_data = self.get_volume_data(keyword)
            if volume_data:
                monthly_searches = volume_data.monthly_searches
                avg_cpc = volume_data.avg_cpc
            else:
                monthly_searches = self.static_engine._estimate_volume_from_keyword(keyword)
                _, avg_cpc, _ = self.static_engine.get_estimated_cpc(keyword, 'phrase')
            
            # Estimate daily metrics
            daily_impressions = int(monthly_searches / 30)
            estimated_ctr = 0.03  # 3% average CTR
            daily_clicks = int(daily_impressions * estimated_ctr)
            daily_cost = daily_clicks * avg_cpc
            estimated_cvr = 0.03  # 3% average CVR
            daily_conversions = int(daily_clicks * estimated_cvr)
            
            forecast_data['keywords'].append({
                'keyword': keyword,
                'impressions': daily_impressions,
                'clicks': daily_clicks,
                'cost': daily_cost,
                'conversions': daily_conversions,
                'ctr': estimated_ctr,
                'cvr': estimated_cvr
            })
            
            total_impressions += daily_impressions
            total_clicks += daily_clicks
            total_cost += daily_cost
            total_conversions += daily_conversions
        
        # Calculate campaign totals
        avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
        avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
        budget_utilization = (total_cost / campaign_budget) * 100 if campaign_budget > 0 else 0
        
        forecast_data['campaign_forecast'] = {
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'total_cost': total_cost,
            'total_conversions': total_conversions,
            'avg_ctr': avg_ctr,
            'avg_cvr': avg_cvr
        }
        forecast_data['budget_utilization'] = budget_utilization
        
        return forecast_data
    
    def get_data_source_info(self) -> Dict[str, any]:
        """Get information about the current data source"""
        return {
            'google_ads_api_available': self.use_google_ads_api,
            'static_data_available': True,
            'current_source': 'google_ads_api' if self.use_google_ads_api else 'static',
            'fallback_enabled': True,
            'cache_enabled': self.use_google_ads_api and self.google_ads_service is not None
        }
    
    def _get_geo_target_id(self, geo: str) -> str:
        """Convert geo string to Google Ads geo target constant ID"""
        geo_mapping = {
            'US': '2840',  # United States
            'CA': '2124',  # Canada
            'UK': '2826',  # United Kingdom
            'AU': '2036',  # Australia
            'DE': '2764',  # Germany
            'FR': '250',   # France
            'IT': '380',   # Italy
            'ES': '724',   # Spain
            'JP': '392',   # Japan
            'BR': '76',    # Brazil
            'IN': '356',   # India
            'MX': '484',   # Mexico
        }
        return geo_mapping.get(geo, '2840')  # Default to US

# Global instance - can be configured via environment variables
USE_GOOGLE_ADS_API = os.getenv('USE_GOOGLE_ADS_API', 'true').lower() == 'true'
hybrid_volume_engine = HybridVolumeEstimationEngine(use_google_ads_api=USE_GOOGLE_ADS_API)

# Convenience functions for backward compatibility
def estimate_keyword_auctions(keyword: str, match_type: str, geo: str) -> AuctionEstimate:
    """Convenience function to estimate auctions for a keyword"""
    return hybrid_volume_engine.estimate_daily_auctions(keyword, match_type, geo)

def get_keyword_volume_data(keyword: str) -> Optional[VolumeData]:
    """Convenience function to get volume data"""
    return hybrid_volume_engine.get_volume_data(keyword)

def get_competition_level(keyword: str) -> str:
    """Convenience function to get competition level"""
    return hybrid_volume_engine.get_competition_level(keyword)

def get_estimated_cpc(keyword: str, match_type: str) -> Tuple[float, float, float]:
    """Convenience function to get estimated CPC"""
    return hybrid_volume_engine.get_estimated_cpc(keyword, match_type)

def get_keyword_forecast(keywords: List[str], campaign_budget: float, geo: str = 'US', language: str = 'en') -> Dict[str, any]:
    """Convenience function to get keyword forecast"""
    return hybrid_volume_engine.get_keyword_forecast(keywords, campaign_budget, geo, language)
