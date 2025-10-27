"""
Google Ads API Integration for Volume Estimation

This module integrates with the Google Ads API to get real search volume data
instead of using static mock data.
"""

import os
import json
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Google Ads API imports
try:
    from google.ads.googleads.client import GoogleAdsClient
    from google.ads.googleads.errors import GoogleAdsException
    from google.ads.googleads.v16.enums.types.keyword_plan_network import KeywordPlanNetworkEnum
    from google.ads.googleads.v16.services.keyword_plan_idea_service import KeywordPlanIdeaServiceClient
    from google.ads.googleads.v16.services.keyword_plan_service import KeywordPlanServiceClient
    from google.ads.googleads.v16.services.geo_target_constant_service import GeoTargetConstantServiceClient
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanKeywordAnnotation
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordAndUrlSeed
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordSeed
    from google.ads.googleads.v16.common.keyword_plan_common import UrlSeed
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanGeoTargeting
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanLanguageTargeting
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanHistoricalMetrics
    from google.ads.googleads.v16.common.keyword_plan_common import MonthlySearchVolume
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanCampaign
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanAdGroup
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanKeyword
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanForecastPeriod
    from google.ads.googleads.v16.common.keyword_plan_common import KeywordPlanForecastPeriodEnum
    from google.ads.googleads.v16.enums.types.keyword_plan_competition_level import KeywordPlanCompetitionLevelEnum
    from google.ads.googleads.v16.enums.types.keyword_plan_network import KeywordPlanNetworkEnum
    from google.ads.googleads.v16.enums.types.geo_target_constant_status import GeoTargetConstantStatusEnum
    from google.ads.googleads.v16.enums.types.language_code import LanguageCodeEnum
    GOOGLE_ADS_API_AVAILABLE = True
except ImportError:
    GOOGLE_ADS_API_AVAILABLE = False
    print("Warning: Google Ads API not installed. Install with: pip install google-ads")

logger = logging.getLogger(__name__)

@dataclass
class GoogleAdsVolumeData:
    """Volume data from Google Ads API"""
    keyword: str
    monthly_searches: int
    competition: str  # 'Low', 'Medium', 'High'
    competition_index: float  # 0.0 to 1.0
    avg_cpc: float
    cpc_low: float
    cpc_high: float
    cached_at: datetime
    geo: str
    language: str

class GoogleAdsVolumeEngine:
    """Google Ads API integration for volume estimation"""
    
    def __init__(self, credentials_path: str = None, customer_id: str = None):
        """
        Initialize Google Ads API client
        
        Args:
            credentials_path: Path to Google Ads API credentials JSON file
            customer_id: Google Ads customer ID (without dashes)
        """
        self.customer_id = customer_id or os.getenv('GOOGLE_ADS_CUSTOMER_ID')
        self.credentials_path = credentials_path or os.getenv('GOOGLE_ADS_CREDENTIALS_PATH')
        self.client = None
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        if GOOGLE_ADS_API_AVAILABLE and self.credentials_path and self.customer_id:
            try:
                self.client = GoogleAdsClient.load_from_storage(self.credentials_path)
                logger.info("Google Ads API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google Ads API client: {e}")
                self.client = None
        else:
            logger.warning("Google Ads API not available - using fallback data")
    
    def get_keyword_volume_data(
        self, 
        keywords: List[str], 
        geo: str = 'US', 
        language: str = 'en'
    ) -> List[GoogleAdsVolumeData]:
        """
        Get volume data for keywords from Google Ads API
        
        Args:
            keywords: List of keywords to get volume data for
            geo: Geographic targeting (US, CA, UK, etc.)
            language: Language targeting (en, es, fr, etc.)
            
        Returns:
            List of volume data for each keyword
        """
        if not self.client:
            return self._get_fallback_data(keywords, geo, language)
        
        # Check cache first
        cache_key = f"{geo}_{language}_{hash(tuple(sorted(keywords)))}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_duration:
                logger.info(f"Using cached volume data for {len(keywords)} keywords")
                return cached_data
        
        try:
            # Get geo target constant
            geo_target = self._get_geo_target_constant(geo)
            if not geo_target:
                logger.warning(f"Could not find geo target for {geo}, using fallback")
                return self._get_fallback_data(keywords, geo, language)
            
            # Get language constant
            language_constant = self._get_language_constant(language)
            if not language_constant:
                logger.warning(f"Could not find language constant for {language}, using fallback")
                return self._get_fallback_data(keywords, geo, language)
            
            # Create keyword plan idea request
            keyword_plan_idea_service = self.client.get_service("KeywordPlanIdeaService")
            
            # Create keyword seed
            keyword_seed = KeywordSeed(keywords=keywords)
            
            # Create geo targeting
            geo_targeting = KeywordPlanGeoTargeting(
                geo_target_constants=[geo_target]
            )
            
            # Create language targeting
            language_targeting = KeywordPlanLanguageTargeting(
                language_constants=[language_constant]
            )
            
            # Create request
            request = self.client.get_type("GenerateKeywordIdeasRequest")
            request.customer_id = self.customer_id
            request.keyword_seed = keyword_seed
            request.geo_target_constants = [geo_target]
            request.language = language_constant
            request.keyword_plan_network = KeywordPlanNetworkEnum.GOOGLE_SEARCH
            
            # Execute request
            response = keyword_plan_idea_service.generate_keyword_ideas(request=request)
            
            # Process results
            volume_data = []
            for idea in response:
                keyword_text = idea.text
                historical_metrics = idea.keyword_idea_metrics
                
                if historical_metrics:
                    monthly_searches = historical_metrics.avg_monthly_searches or 0
                    competition = self._map_competition_level(historical_metrics.competition)
                    competition_index = self._map_competition_index(historical_metrics.competition)
                    
                    # Get CPC data
                    low_cpc = historical_metrics.low_top_of_page_bid_micros / 1_000_000 if historical_metrics.low_top_of_page_bid_micros else 0
                    high_cpc = historical_metrics.high_top_of_page_bid_micros / 1_000_000 if historical_metrics.high_top_of_page_bid_micros else 0
                    avg_cpc = (low_cpc + high_cpc) / 2 if low_cpc and high_cpc else 0
                    
                    volume_data.append(GoogleAdsVolumeData(
                        keyword=keyword_text,
                        monthly_searches=monthly_searches,
                        competition=competition,
                        competition_index=competition_index,
                        avg_cpc=avg_cpc,
                        cpc_low=low_cpc,
                        cpc_high=high_cpc,
                        cached_at=datetime.now(),
                        geo=geo,
                        language=language
                    ))
            
            # Cache the results
            self.cache[cache_key] = (volume_data, datetime.now())
            
            logger.info(f"Retrieved volume data for {len(volume_data)} keywords from Google Ads API")
            return volume_data
            
        except GoogleAdsException as ex:
            logger.error(f"Google Ads API error: {ex}")
            return self._get_fallback_data(keywords, geo, language)
        except Exception as ex:
            logger.error(f"Unexpected error getting volume data: {ex}")
            return self._get_fallback_data(keywords, geo, language)
    
    def _get_geo_target_constant(self, geo: str) -> Optional[str]:
        """Get geo target constant resource name"""
        geo_mapping = {
            'US': 'geoTargetConstants/2840',  # United States
            'CA': 'geoTargetConstants/2124',  # Canada
            'UK': 'geoTargetConstants/2826',  # United Kingdom
            'AU': 'geoTargetConstants/2036',  # Australia
            'DE': 'geoTargetConstants/2764',  # Germany
            'FR': 'geoTargetConstants/250',   # France
            'IT': 'geoTargetConstants/380',   # Italy
            'ES': 'geoTargetConstants/724',   # Spain
            'JP': 'geoTargetConstants/392',   # Japan
            'BR': 'geoTargetConstants/76',    # Brazil
            'IN': 'geoTargetConstants/356',   # India
            'MX': 'geoTargetConstants/484',   # Mexico
        }
        return geo_mapping.get(geo)
    
    def _get_language_constant(self, language: str) -> Optional[str]:
        """Get language constant resource name"""
        language_mapping = {
            'en': 'languageConstants/1000',  # English
            'es': 'languageConstants/1002',  # Spanish
            'fr': 'languageConstants/1003',  # French
            'de': 'languageConstants/1005',  # German
            'it': 'languageConstants/1006',  # Italian
            'pt': 'languageConstants/1007',  # Portuguese
            'ru': 'languageConstants/1008',  # Russian
            'ja': 'languageConstants/1009',  # Japanese
            'ko': 'languageConstants/1010',  # Korean
            'zh': 'languageConstants/1011',  # Chinese
            'ar': 'languageConstants/1001',  # Arabic
            'hi': 'languageConstants/1004',  # Hindi
        }
        return language_mapping.get(language)
    
    def _map_competition_level(self, competition_enum) -> str:
        """Map Google Ads competition enum to string"""
        if not competition_enum:
            return 'Medium'
        
        competition_mapping = {
            0: 'Low',      # UNKNOWN
            1: 'Low',      # LOW
            2: 'Medium',   # MEDIUM
            3: 'High',     # HIGH
        }
        return competition_mapping.get(competition_enum, 'Medium')
    
    def _map_competition_index(self, competition_enum) -> float:
        """Map Google Ads competition enum to index (0.0 to 1.0)"""
        if not competition_enum:
            return 0.5
        
        competition_mapping = {
            0: 0.3,  # UNKNOWN -> Low
            1: 0.3,  # LOW
            2: 0.6,  # MEDIUM
            3: 0.9,  # HIGH
        }
        return competition_mapping.get(competition_enum, 0.5)
    
    def _get_fallback_data(self, keywords: List[str], geo: str, language: str) -> List[GoogleAdsVolumeData]:
        """Fallback to static data when Google Ads API is not available"""
        from app.core.volume_estimation import volume_engine
        
        fallback_data = []
        for keyword in keywords:
            volume_data = volume_engine.get_volume_data(keyword)
            if volume_data:
                fallback_data.append(GoogleAdsVolumeData(
                    keyword=keyword,
                    monthly_searches=volume_data.monthly_searches,
                    competition=volume_data.competition,
                    competition_index=volume_data.competition_index,
                    avg_cpc=volume_data.avg_cpc,
                    cpc_low=volume_data.cpc_low,
                    cpc_high=volume_data.cpc_high,
                    cached_at=datetime.now(),
                    geo=geo,
                    language=language
                ))
            else:
                # Use estimation logic
                competition = volume_engine.get_competition_level(keyword)
                low_cpc, avg_cpc, high_cpc = volume_engine.get_estimated_cpc(keyword, 'phrase')
                
                fallback_data.append(GoogleAdsVolumeData(
                    keyword=keyword,
                    monthly_searches=volume_engine._estimate_volume_from_keyword(keyword),
                    competition=competition,
                    competition_index=0.5,
                    avg_cpc=avg_cpc,
                    cpc_low=low_cpc,
                    cpc_high=high_cpc,
                    cached_at=datetime.now(),
                    geo=geo,
                    language=language
                ))
        
        logger.info(f"Using fallback data for {len(keywords)} keywords")
        return fallback_data
    
    def get_keyword_forecast(
        self,
        keywords: List[str],
        campaign_budget: float,
        geo: str = 'US',
        language: str = 'en'
    ) -> Dict[str, any]:
        """
        Get keyword forecast data from Google Ads API
        
        Args:
            keywords: List of keywords to forecast
            campaign_budget: Daily campaign budget
            geo: Geographic targeting
            language: Language targeting
            
        Returns:
            Forecast data including impressions, clicks, cost, conversions
        """
        if not self.client:
            return self._get_fallback_forecast(keywords, campaign_budget, geo, language)
        
        try:
            # This would require implementing keyword plan creation and forecasting
            # For now, return fallback data
            return self._get_fallback_forecast(keywords, campaign_budget, geo, language)
            
        except Exception as ex:
            logger.error(f"Error getting keyword forecast: {ex}")
            return self._get_fallback_forecast(keywords, campaign_budget, geo, language)
    
    def _get_fallback_forecast(
        self,
        keywords: List[str],
        campaign_budget: float,
        geo: str,
        language: str
    ) -> Dict[str, any]:
        """Fallback forecast using static data"""
        from app.core.volume_estimation import volume_engine
        
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
            'source': 'fallback'
        }
        
        total_impressions = 0
        total_clicks = 0
        total_cost = 0
        total_conversions = 0
        
        for keyword in keywords:
            volume_data = volume_engine.get_volume_data(keyword)
            if volume_data:
                monthly_searches = volume_data.monthly_searches
                avg_cpc = volume_data.avg_cpc
            else:
                monthly_searches = volume_engine._estimate_volume_from_keyword(keyword)
                _, avg_cpc, _ = volume_engine.get_estimated_cpc(keyword, 'phrase')
            
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

# Global instance
google_ads_volume_engine = GoogleAdsVolumeEngine()

def get_google_ads_volume_data(keywords: List[str], geo: str = 'US', language: str = 'en') -> List[GoogleAdsVolumeData]:
    """Convenience function to get volume data from Google Ads API"""
    return google_ads_volume_engine.get_keyword_volume_data(keywords, geo, language)

def get_google_ads_forecast(keywords: List[str], campaign_budget: float, geo: str = 'US', language: str = 'en') -> Dict[str, any]:
    """Convenience function to get forecast data from Google Ads API"""
    return google_ads_volume_engine.get_keyword_forecast(keywords, campaign_budget, geo, language)
