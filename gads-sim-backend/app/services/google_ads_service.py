"""
Google Ads Keyword Generation Service

This module provides keyword generation functionality using the Google Ads API.
It can generate keyword ideas from URLs, product descriptions, or seed keywords.

Key Features:
- Generate up to 25 keyword ideas from URL or product description
- Get search volume, competition, and CPC estimates
- Cache results to minimize API calls
- Support for multiple languages and locations
- Deterministic output for consistent results

Dependencies:
    google-ads>=24.1.0
    pyyaml>=6.0
"""

import os
import yaml
import hashlib
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s - %(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class GoogleAdsKeywordService:
    """
    Service for generating keyword ideas using Google Ads API.
    
    This service provides methods to generate keyword suggestions from:
    - Website URLs
    - Product/service descriptions
    - Seed keywords
    
    Results include:
    - Keyword text
    - Average monthly searches
    - Competition level (LOW, MEDIUM, HIGH)
    - CPC range (min/max)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Google Ads Keyword Service.
        
        Args:
            config_path: Path to config.yaml file (deprecated, uses env vars by default). If None, uses environment variables.
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.client = None
        self.cache_dir = self._get_cache_dir()
        
        # Initialize Google Ads client
        try:
            self._init_google_ads_client()
            logger.info("Google Ads client initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Google Ads client: {e}")
            logger.warning("Service will operate in mock mode")
    
    def _get_default_config_path(self) -> str:
        """Get default config.yaml path."""
        backend_dir = Path(__file__).parent.parent.parent
        return str(backend_dir / "config.yaml")
    
    def _get_cache_dir(self) -> Path:
        """Get cache directory for keyword results."""
        backend_dir = Path(__file__).parent.parent.parent
        cache_dir = backend_dir / "cache" / "google_ads"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables or config.yaml (fallback)."""
        # Try to load from environment variables first (recommended)
        if os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN'):
            logger.info("Loading configuration from environment variables")
            return {
                'developer_token': os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN'),
                'client_id': os.getenv('GOOGLE_ADS_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_ADS_CLIENT_SECRET'),
                'refresh_token': os.getenv('GOOGLE_ADS_REFRESH_TOKEN'),
                'customer_id': os.getenv('GOOGLE_ADS_CUSTOMER_ID'),
                'login_customer_id': os.getenv('GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
                'use_proto_plus': os.getenv('GOOGLE_ADS_USE_PROTO_PLUS', 'True').lower() == 'true'
            }
        
        # Fallback to config.yaml if provided (deprecated)
        if self.config_path:
            try:
                with open(self.config_path, 'r') as f:
                    config = yaml.safe_load(f)
                logger.warning(f"Configuration loaded from {self.config_path} (deprecated - please use environment variables)")
                return config
            except FileNotFoundError:
                logger.error(f"Config file not found at {self.config_path}")
                raise
            except yaml.YAMLError as e:
                logger.error(f"Error parsing config.yaml: {e}")
                raise
        else:
            logger.error("No configuration found. Please set GOOGLE_ADS_* environment variables.")
            raise ValueError("Missing Google Ads API configuration")
    
    def _init_google_ads_client(self):
        """Initialize Google Ads API client."""
        try:
            from google.ads.googleads.client import GoogleAdsClient
            
            # Create credentials dictionary from config
            # Ensure customer IDs are strings (API requires string format)
            login_customer_id = self.config.get('login_customer_id')
            
            credentials = {
                'developer_token': self.config.get('developer_token'),
                'client_id': self.config.get('client_id'),
                'client_secret': self.config.get('client_secret'),
                'refresh_token': self.config.get('refresh_token'),
                'login_customer_id': str(login_customer_id) if login_customer_id else None,
                'use_proto_plus': self.config.get('use_proto_plus', True)
            }
            
            # Validate credentials
            if not all([credentials['developer_token'], 
                       credentials['client_id'],
                       credentials['client_secret']]):
                raise ValueError("Missing required Google Ads API credentials. Please set GOOGLE_ADS_* environment variables.")
            
            # Initialize client
            self.client = GoogleAdsClient.load_from_dict(credentials)
            
        except ImportError:
            logger.error("google-ads library not installed. Run: pip install google-ads")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Google Ads client: {e}")
            raise
    
    def _generate_cache_key(self, url: str, product_description: str, 
                           language: str, location: str) -> str:
        """
        Generate cache key for keyword request.
        
        Args:
            url: Website URL
            product_description: Product/service description
            language: Language code
            location: Location code
            
        Returns:
            SHA-256 hash of input parameters
        """
        cache_input = f"{url}|{product_description}|{language}|{location}|v2"
        return hashlib.sha256(cache_input.encode()).hexdigest()
    
    def _get_cached_result(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve cached keyword results if available and not expired.
        
        Args:
            cache_key: Cache key hash
            
        Returns:
            Cached keyword list or None if not found/expired
        """
        if not self.config.get('caching', {}).get('enabled', True):
            return None
        
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        if not cache_file.exists():
            return None
        
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            
            # Check if cache is expired
            ttl_hours = self.config.get('caching', {}).get('ttl_hours', 48)
            cached_time = datetime.fromisoformat(cached_data['timestamp'])
            
            if datetime.now() - cached_time > timedelta(hours=ttl_hours):
                logger.info(f"Cache expired for key {cache_key}")
                cache_file.unlink()  # Delete expired cache
                return None
            
            logger.info(f"Cache hit for key {cache_key}")
            return cached_data['keywords']
            
        except Exception as e:
            logger.warning(f"Error reading cache: {e}")
            return None
    
    def _save_to_cache(self, cache_key: str, keywords: List[Dict[str, Any]]):
        """
        Save keyword results to cache.
        
        Args:
            cache_key: Cache key hash
            keywords: List of keyword dictionaries
        """
        if not self.config.get('caching', {}).get('enabled', True):
            return
        
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'keywords': keywords
            }
            
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2)
            
            logger.info(f"Results cached with key {cache_key}")
            
        except Exception as e:
            logger.warning(f"Error saving to cache: {e}")
    
    def generate_keywords_from_url(
        self,
        url: str,
        product_description: Optional[str] = None,
        language: str = "en",
        location: str = "2840",  # US by default
        max_keywords: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Generate keyword ideas from a URL and optional product description.
        
        Args:
            url: Website URL to analyze
            product_description: Optional product/service description
            language: Language code (ISO 639-1, e.g., 'en', 'es', 'fr')
            location: Geo target constant ID (e.g., 2840 for US)
            max_keywords: Maximum number of keywords to return (default: 25)
            
        Returns:
            List of keyword dictionaries with:
                - text: Keyword text
                - avg_monthly_searches: Average monthly searches
                - competition: Competition level (LOW, MEDIUM, HIGH)
                - competition_index: Competition index (0-100)
                - low_top_of_page_bid_micros: Low CPC estimate (micros)
                - high_top_of_page_bid_micros: High CPC estimate (micros)
                
        Example:
            >>> service = GoogleAdsKeywordService()
            >>> keywords = service.generate_keywords_from_url(
            ...     url="https://www.example.com",
            ...     product_description="organic coffee beans",
            ...     max_keywords=25
            ... )
        """
        # Check cache first
        cache_key = self._generate_cache_key(url, product_description or "", language, location)
        cached_result = self._get_cached_result(cache_key)
        
        if cached_result:
            return cached_result[:max_keywords]
        
        # If no client available, raise error instead of returning mock data
        if not self.client:
            logger.error("No Google Ads client available")
            raise ValueError("Google Ads API client is not available. Please check configuration.")
        
        try:
            # Get keyword ideas from Google Ads API
            keywords = self._fetch_keyword_ideas(
                url=url,
                product_description=product_description,
                language=language,
                location=location,
                max_keywords=max_keywords
            )
            
            # Cache results
            self._save_to_cache(cache_key, keywords)
            
            return keywords
            
        except Exception as e:
            logger.error(f"Error generating keywords from Google Ads API: {e}")
            raise
    
    def _fetch_keyword_ideas(
        self,
        url: Optional[str] = None,
        product_description: Optional[str] = None,
        language: str = "en",
        location: str = "2840",
        max_keywords: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Fetch keyword ideas from Google Ads API.
        
        This method uses the KeywordPlanIdeaService to generate keyword suggestions.
        """
        try:
            from google.ads.googleads.client import GoogleAdsClient
            
            # Get services
            keyword_plan_idea_service = self.client.get_service("KeywordPlanIdeaService")
            geo_target_constant_service = self.client.get_service("GeoTargetConstantService")
            
            # Build request
            request = self.client.get_type("GenerateKeywordIdeasRequest")
            # Ensure customer_id is a string (API requires string format)
            customer_id = self.config.get('customer_id')
            request.customer_id = str(customer_id) if customer_id else None
            
            # Set language
            request.language = f"languageConstants/{self._get_language_constant(language)}"
            
            # Set location
            request.geo_target_constants.append(f"geoTargetConstants/{location}")
            
            # Include adult keywords setting
            request.include_adult_keywords = self.config.get('keyword_generation', {}).get(
                'include_adult_keywords', False
            )
            
            # Set keyword plan network
            network_value = self.config.get('keyword_generation', {}).get(
                'keyword_plan_network', 'GOOGLE_SEARCH'
            )
            request.keyword_plan_network = getattr(
                self.client.enums.KeywordPlanNetworkEnum, network_value
            )
            
            # Set URL or keywords seed (oneof constraint)
            if url and product_description:
                # Both URL and product description provided - use keyword_and_url_seed
                request.keyword_and_url_seed.url = url
                # Split product description into individual keywords
                keywords = [k.strip() for k in product_description.split(',') if k.strip()]
                request.keyword_and_url_seed.keywords.extend(keywords)
                logger.info(f"Using keyword_and_url_seed with URL: {url} and keywords: {keywords}")
            elif url:
                # Only URL provided - use url_seed (Google Ads API feature)
                request.url_seed.url = url
                logger.info(f"Using url_seed with URL: {url}")
            elif product_description:
                # Only product description provided - use keyword_seed
                keywords = [k.strip() for k in product_description.split(',') if k.strip()]
                request.keyword_seed.keywords.extend(keywords)
                logger.info(f"Using keyword_seed with keywords: {keywords}")
            else:
                logger.warning("No URL or product description provided")
            
            # Execute request
            response = keyword_plan_idea_service.generate_keyword_ideas(request=request)
            
            # Parse results
            keywords = []
            for idea in response:
                if len(keywords) >= max_keywords:
                    break
                
                keyword_data = {
                    'text': idea.text,
                    'avg_monthly_searches': idea.keyword_idea_metrics.avg_monthly_searches,
                    'competition': idea.keyword_idea_metrics.competition.name,
                    'competition_index': idea.keyword_idea_metrics.competition_index,
                    'low_top_of_page_bid_micros': idea.keyword_idea_metrics.low_top_of_page_bid_micros,
                    'high_top_of_page_bid_micros': idea.keyword_idea_metrics.high_top_of_page_bid_micros,
                }
                
                keywords.append(keyword_data)
            
            logger.info(f"Generated {len(keywords)} keywords from Google Ads API")
            return keywords
            
        except Exception as e:
            logger.error(f"Error in _fetch_keyword_ideas: {e}")
            raise
    
    def _get_language_constant(self, language_code: str) -> int:
        """
        Get language constant ID from language code.
        
        Common mappings:
        - en: 1000 (English)
        - es: 1003 (Spanish)
        - fr: 1002 (French)
        - de: 1001 (German)
        """
        language_map = {
            'en': 1000,
            'es': 1003,
            'fr': 1002,
            'de': 1001,
            'it': 1004,
            'pt': 1014,
            'ja': 1005,
            'zh': 1017,
            'ko': 1012,
        }
        
        return language_map.get(language_code.lower(), 1000)  # Default to English
    
    def _generate_mock_keywords(
        self,
        url: Optional[str],
        product_description: Optional[str],
        max_keywords: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Generate mock keyword data for testing/development.
        
        This is used when Google Ads API is not available or configured.
        """
        logger.info("Generating mock keyword data")
        
        # Extract base terms from description and URL
        base_terms = []
        
        if product_description:
            # Simple word extraction
            words = product_description.lower().split()
            base_terms.extend([w for w in words if len(w) > 3])
        
        if url:
            # Extract domain words
            domain_words = url.replace('https://', '').replace('http://', '').replace('www.', '')
            domain_words = domain_words.split('/')[0].replace('.com', '').replace('.', ' ')
            base_terms.extend(domain_words.split())
        
        # Generate mock keywords
        mock_keywords = []
        
        # Keyword patterns
        modifiers = [
            '', 'best', 'cheap', 'affordable', 'premium', 'quality',
            'buy', 'online', 'near me', 'reviews', 'top rated'
        ]
        
        suffixes = [
            '', 'service', 'store', 'shop', 'company', 'supplier',
            'provider', 'dealer', 'retailer'
        ]
        
        # Generate combinations
        keyword_set = set()
        
        for base in base_terms[:3]:  # Use first 3 base terms
            for modifier in modifiers[:8]:
                for suffix in suffixes[:3]:
                    parts = [p for p in [modifier, base, suffix] if p]
                    keyword = ' '.join(parts)
                    
                    if keyword and keyword not in keyword_set:
                        keyword_set.add(keyword)
                        
                        # Generate mock metrics
                        import random
                        random.seed(hash(keyword) % (2**32))  # Deterministic based on keyword
                        
                        competition_levels = ['LOW', 'MEDIUM', 'HIGH']
                        
                        mock_keywords.append({
                            'text': keyword,
                            'avg_monthly_searches': random.randint(100, 50000),
                            'competition': random.choice(competition_levels),
                            'competition_index': random.randint(0, 100),
                            'low_top_of_page_bid_micros': random.randint(500000, 2000000),
                            'high_top_of_page_bid_micros': random.randint(2000000, 10000000),
                        })
                        
                        if len(mock_keywords) >= max_keywords:
                            break
                if len(mock_keywords) >= max_keywords:
                    break
            if len(mock_keywords) >= max_keywords:
                break
        
        # Ensure we have at least max_keywords
        while len(mock_keywords) < max_keywords:
            i = len(mock_keywords)
            mock_keywords.append({
                'text': f"keyword {i + 1}",
                'avg_monthly_searches': 1000 + i * 100,
                'competition': 'MEDIUM',
                'competition_index': 50,
                'low_top_of_page_bid_micros': 1000000,
                'high_top_of_page_bid_micros': 5000000,
            })
        
        return mock_keywords[:max_keywords]
    
    def get_historical_metrics(
        self,
        keywords: List[str],
        language: str = "en",
        location: str = "2840",  # US by default
        date_range: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get historical metrics (search volume & CPC) for keywords using GenerateKeywordHistoricalMetrics.
        
        Args:
            keywords: List of keyword texts to analyze
            language: Language code (ISO 639-1, e.g., 'en', 'es', 'fr')
            location: Geo target constant ID (e.g., 2840 for US)
            date_range: Optional date range for historical data
            
        Returns:
            List of keyword dictionaries with historical metrics:
                - keyword: Keyword text
                - avg_monthly_searches: Average monthly searches
                - competition: Competition level (LOW, MEDIUM, HIGH)
                - competition_index: Competition index (0-100)
                - low_top_of_page_bid_micros: Low CPC estimate (micros)
                - high_top_of_page_bid_micros: High CPC estimate (micros)
        """
        # Check cache first
        cache_key = self._generate_historical_cache_key(keywords, language, location, date_range)
        cached_result = self._get_cached_result(cache_key)
        
        if cached_result:
            return cached_result
        
        # If no client available, return mock data
        if not self.client:
            logger.warning("No Google Ads client available, returning mock historical data")
            return self._generate_mock_historical_metrics(keywords)
        
        try:
            # Get historical metrics from Google Ads API
            metrics = self._fetch_historical_metrics(
                keywords=keywords,
                language=language,
                location=location,
                date_range=date_range
            )
            
            # Cache results
            self._save_to_cache(cache_key, metrics)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting historical metrics from Google Ads API: {e}")
            logger.info("Falling back to mock data")
            return self._generate_mock_historical_metrics(keywords)
    
    def get_forecast_metrics(
        self,
        keywords: List[str],
        campaign_budget: float,
        language: str = "en",
        location: str = "2840",  # US by default
        bidding_strategy: str = "manual_cpc"
    ) -> Dict[str, Any]:
        """
        Get performance projections for keywords using GenerateForecastMetrics.
        
        Args:
            keywords: List of keyword texts to analyze
            campaign_budget: Daily campaign budget in dollars
            language: Language code (ISO 639-1, e.g., 'en', 'es', 'fr')
            location: Geo target constant ID (e.g., 2840 for US)
            bidding_strategy: Bidding strategy (manual_cpc, target_cpa, etc.)
            
        Returns:
            Dictionary with forecast metrics:
                - keywords: List of keyword forecasts
                - campaign_forecast: Overall campaign projections
                - budget_utilization: Expected budget usage
        """
        # Check cache first
        cache_key = self._generate_forecast_cache_key(keywords, campaign_budget, language, location, bidding_strategy)
        cached_result = self._get_cached_result(cache_key)
        
        if cached_result:
            return cached_result
        
        # If no client available, return mock data
        if not self.client:
            logger.warning("No Google Ads client available, returning mock forecast data")
            return self._generate_mock_forecast_metrics(keywords, campaign_budget)
        
        try:
            # Get forecast metrics from Google Ads API
            forecast = self._fetch_forecast_metrics(
                keywords=keywords,
                campaign_budget=campaign_budget,
                language=language,
                location=location,
                bidding_strategy=bidding_strategy
            )
            
            # Cache results
            self._save_to_cache(cache_key, forecast)
            
            return forecast
            
        except Exception as e:
            logger.error(f"Error getting forecast metrics from Google Ads API: {e}")
            logger.info("Falling back to mock data")
            return self._generate_mock_forecast_metrics(keywords, campaign_budget)
    
    def _generate_historical_cache_key(self, keywords: List[str], language: str, location: str, date_range: Optional[str]) -> str:
        """Generate cache key for historical metrics request."""
        keywords_str = "|".join(sorted(keywords))
        cache_input = f"historical|{keywords_str}|{language}|{location}|{date_range or 'default'}|v1"
        return hashlib.sha256(cache_input.encode()).hexdigest()
    
    def _generate_forecast_cache_key(self, keywords: List[str], budget: float, language: str, location: str, strategy: str) -> str:
        """Generate cache key for forecast metrics request."""
        keywords_str = "|".join(sorted(keywords))
        cache_input = f"forecast|{keywords_str}|{budget}|{language}|{location}|{strategy}|v1"
        return hashlib.sha256(cache_input.encode()).hexdigest()
    
    def _fetch_historical_metrics(
        self,
        keywords: List[str],
        language: str = "en",
        location: str = "2840",
        date_range: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical metrics from Google Ads API using GenerateKeywordHistoricalMetrics.
        """
        try:
            from google.ads.googleads.client import GoogleAdsClient
            
            # Get services
            keyword_plan_idea_service = self.client.get_service("KeywordPlanIdeaService")
            
            # Build request
            request = self.client.get_type("GenerateKeywordHistoricalMetricsRequest")
            customer_id = self.config.get('customer_id')
            request.customer_id = str(customer_id) if customer_id else None
            
            # Set language
            request.language = f"languageConstants/{self._get_language_constant(language)}"
            
            # Set location
            request.geo_target_constants.append(f"geoTargetConstants/{location}")
            
            # Set keywords
            for keyword in keywords:
                request.keywords.append(keyword)
            
            # Set date range if provided
            if date_range:
                # Parse date range and set historical metrics options
                # This would need to be implemented based on the specific date range format
                pass
            
            # Execute request
            response = keyword_plan_idea_service.generate_keyword_historical_metrics(request=request)
            
            # Parse results
            metrics = []
            for result in response:
                if hasattr(result, 'keyword_metrics') and result.keyword_metrics:
                    metrics.append({
                        'keyword': result.keyword,
                        'avg_monthly_searches': result.keyword_metrics.avg_monthly_searches,
                        'competition': result.keyword_metrics.competition.name,
                        'competition_index': result.keyword_metrics.competition_index,
                        'low_top_of_page_bid_micros': result.keyword_metrics.low_top_of_page_bid_micros,
                        'high_top_of_page_bid_micros': result.keyword_metrics.high_top_of_page_bid_micros,
                    })
            
            logger.info(f"Retrieved historical metrics for {len(metrics)} keywords from Google Ads API")
            return metrics
            
        except Exception as e:
            logger.error(f"Error in _fetch_historical_metrics: {e}")
            raise
    
    def _fetch_forecast_metrics(
        self,
        keywords: List[str],
        campaign_budget: float,
        language: str = "en",
        location: str = "2840",
        bidding_strategy: str = "manual_cpc"
    ) -> Dict[str, Any]:
        """
        Fetch forecast metrics from Google Ads API using GenerateForecastMetrics.
        """
        try:
            from google.ads.googleads.client import GoogleAdsClient
            
            # Get services
            keyword_plan_service = self.client.get_service("KeywordPlanService")
            
            # Build request
            request = self.client.get_type("GenerateForecastMetricsRequest")
            customer_id = self.config.get('customer_id')
            request.customer_id = str(customer_id) if customer_id else None
            
            # Set language
            request.language = f"languageConstants/{self._get_language_constant(language)}"
            
            # Set location
            request.geo_target_constants.append(f"geoTargetConstants/{location}")
            
            # Set keywords
            for keyword in keywords:
                request.keywords.append(keyword)
            
            # Set campaign budget (convert to micros)
            request.campaign_budget_micros = int(campaign_budget * 1_000_000)
            
            # Set bidding strategy
            bidding_strategy_enum = getattr(
                self.client.enums.BiddingStrategyTypeEnum, 
                bidding_strategy.upper()
            )
            request.bidding_strategy = bidding_strategy_enum
            
            # Execute request
            response = keyword_plan_service.generate_forecast_metrics(request=request)
            
            # Parse results
            keyword_forecasts = []
            for result in response.keyword_forecasts:
                keyword_forecasts.append({
                    'keyword': result.keyword,
                    'impressions': result.impressions,
                    'clicks': result.clicks,
                    'cost_micros': result.cost_micros,
                    'conversions': result.conversions,
                    'ctr': result.ctr,
                    'cvr': result.cvr,
                })
            
            campaign_forecast = {
                'total_impressions': response.campaign_forecast.total_impressions,
                'total_clicks': response.campaign_forecast.total_clicks,
                'total_cost_micros': response.campaign_forecast.total_cost_micros,
                'total_conversions': response.campaign_forecast.total_conversions,
                'avg_ctr': response.campaign_forecast.avg_ctr,
                'avg_cvr': response.campaign_forecast.avg_cvr,
            }
            
            forecast_data = {
                'keywords': keyword_forecasts,
                'campaign_forecast': campaign_forecast,
                'budget_utilization': campaign_forecast['total_cost_micros'] / (campaign_budget * 1_000_000)
            }
            
            logger.info(f"Retrieved forecast metrics for {len(keyword_forecasts)} keywords from Google Ads API")
            return forecast_data
            
        except Exception as e:
            logger.error(f"Error in _fetch_forecast_metrics: {e}")
            raise
    
    def _generate_mock_historical_metrics(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """Generate mock historical metrics for testing/development."""
        logger.info("Generating mock historical metrics")
        
        import random
        metrics = []
        
        for i, keyword in enumerate(keywords):
            # Use keyword hash for deterministic results
            random.seed(hash(keyword) % (2**32))
            
            competition_levels = ['LOW', 'MEDIUM', 'HIGH']
            
            metrics.append({
                'keyword': keyword,
                'avg_monthly_searches': random.randint(100, 50000),
                'competition': random.choice(competition_levels),
                'competition_index': random.randint(0, 100),
                'low_top_of_page_bid_micros': random.randint(500000, 2000000),
                'high_top_of_page_bid_micros': random.randint(2000000, 10000000),
            })
        
        return metrics
    
    def _generate_mock_forecast_metrics(self, keywords: List[str], campaign_budget: float) -> Dict[str, Any]:
        """Generate mock forecast metrics for testing/development."""
        logger.info("Generating mock forecast metrics")
        
        import random
        keyword_forecasts = []
        total_impressions = 0
        total_clicks = 0
        total_cost_micros = 0
        total_conversions = 0
        
        for i, keyword in enumerate(keywords):
            # Use keyword hash for deterministic results
            random.seed(hash(keyword) % (2**32))
            
            impressions = random.randint(1000, 10000)
            ctr = random.uniform(0.01, 0.05)
            clicks = int(impressions * ctr)
            avg_cpc_micros = random.randint(1000000, 5000000)  # $1-$5
            cost_micros = clicks * avg_cpc_micros
            cvr = random.uniform(0.02, 0.08)
            conversions = int(clicks * cvr)
            
            keyword_forecasts.append({
                'keyword': keyword,
                'impressions': impressions,
                'clicks': clicks,
                'cost_micros': cost_micros,
                'conversions': conversions,
                'ctr': ctr,
                'cvr': cvr,
            })
            
            total_impressions += impressions
            total_clicks += clicks
            total_cost_micros += cost_micros
            total_conversions += conversions
        
        campaign_forecast = {
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'total_cost_micros': total_cost_micros,
            'total_conversions': total_conversions,
            'avg_ctr': total_clicks / total_impressions if total_impressions > 0 else 0,
            'avg_cvr': total_conversions / total_clicks if total_clicks > 0 else 0,
        }
        
        return {
            'keywords': keyword_forecasts,
            'campaign_forecast': campaign_forecast,
            'budget_utilization': total_cost_micros / (campaign_budget * 1_000_000)
        }

    def format_keywords_for_display(
        self,
        keywords: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format keyword data for frontend display.
        
        Converts micros to dollars and adds user-friendly fields.
        """
        formatted = []
        
        for kw in keywords:
            formatted.append({
                'keyword': kw['text'],
                'monthly_searches': kw['avg_monthly_searches'],
                'competition': kw['competition'],
                'competition_index': kw.get('competition_index', 0),
                'low_cpc': kw['low_top_of_page_bid_micros'] / 1_000_000,  # Convert to dollars
                'high_cpc': kw['high_top_of_page_bid_micros'] / 1_000_000,
                'avg_cpc': (
                    kw['low_top_of_page_bid_micros'] + kw['high_top_of_page_bid_micros']
                ) / 2_000_000,
            })
        
        return formatted


# Example usage
if __name__ == "__main__":
    # Initialize service
    service = GoogleAdsKeywordService()
    
    # Test URL
    test_url = "https://www.example.com"
    test_description = "organic coffee beans"
    
    print(f"Generating keywords for: {test_url}")
    print(f"Product description: {test_description}")
    print("-" * 80)
    
    # Generate keywords
    keywords = service.generate_keywords_from_url(
        url=test_url,
        product_description=test_description,
        language="en",
        location="2840",  # United States
        max_keywords=25
    )
    
    # Format for display
    formatted_keywords = service.format_keywords_for_display(keywords)
    
    # Display results
    print(f"\nGenerated {len(formatted_keywords)} keywords:\n")
    
    for i, kw in enumerate(formatted_keywords, 1):
        print(f"{i}. {kw['keyword']}")
        print(f"   Monthly Searches: {kw['monthly_searches']:,}")
        print(f"   Competition: {kw['competition']} ({kw['competition_index']}/100)")
        print(f"   CPC Range: ${kw['low_cpc']:.2f} - ${kw['high_cpc']:.2f}")
        print(f"   Avg CPC: ${kw['avg_cpc']:.2f}")
        print()
