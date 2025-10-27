"""
Keyword suggestions API - Google Ads API integration
"""
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Import the Google Ads service
from app.services.google_ads_service import GoogleAdsKeywordService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Google Ads service
try:
    google_ads_service = GoogleAdsKeywordService()
    logger.info("Google Ads service initialized successfully")
except Exception as e:
    logger.warning(f"Failed to initialize Google Ads service: {e}")
    google_ads_service = None


class KeywordIdeasRequest(BaseModel):
    seed_keywords: Optional[List[str]] = None
    url: Optional[str] = None
    product_description: Optional[str] = None
    geo: str = "US"
    language: str = "en"


class KeywordIdea(BaseModel):
    text: str
    monthly_searches: int
    competition: str
    competition_index: Optional[float] = None
    cpc_low: float
    cpc_high: float


class KeywordIdeasResponse(BaseModel):
    keywords: List[KeywordIdea]
    cached: bool = False
    source: str = "mock"


class HistoricalMetricsRequest(BaseModel):
    keywords: List[str]
    geo: str = "US"
    language: str = "en"
    date_range: Optional[str] = None


class HistoricalMetric(BaseModel):
    keyword: str
    avg_monthly_searches: int
    competition: str
    competition_index: Optional[float] = None
    low_cpc: float
    high_cpc: float
    avg_cpc: float


class HistoricalMetricsResponse(BaseModel):
    metrics: List[HistoricalMetric]
    cached: bool = False
    source: str = "mock"


class ForecastMetricsRequest(BaseModel):
    keywords: List[str]
    campaign_budget: float = Field(gt=0, description="Daily campaign budget in dollars")
    geo: str = "US"
    language: str = "en"
    bidding_strategy: str = Field(default="manual_cpc", pattern="^(manual_cpc|target_cpa|target_roas|maximize_clicks)$")


class KeywordForecast(BaseModel):
    keyword: str
    impressions: int
    clicks: int
    cost: float
    conversions: int
    ctr: float
    cvr: float


class CampaignForecast(BaseModel):
    total_impressions: int
    total_clicks: int
    total_cost: float
    total_conversions: int
    avg_ctr: float
    avg_cvr: float


class ForecastMetricsResponse(BaseModel):
    keywords: List[KeywordForecast]
    campaign_forecast: CampaignForecast
    budget_utilization: float
    cached: bool = False
    source: str = "mock"


def _dedupe_preserve_order(values: List[str]) -> List[str]:
    """Remove duplicates while preserving order"""
    seen = set()
    result: List[str] = []
    for v in values:
        if not v:
            continue
        key = v.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(v.strip())
    return result


def _generate_mock_keywords(base_terms: List[str]) -> List[KeywordIdea]:
    """Generate mock keywords for keyword suggestions"""
    variations = []
    suffixes = [
        "services",
        "company", 
        "near me",
        "pricing",
        "best",
        "top",
        "experts",
        "agency",
        "consultants",
        "solutions",
        "providers",
        "professional",
        "affordable",
        "local",
        "online",
    ]
    
    # Add base terms
    for term in base_terms[:5]:
        term = term.strip()
        variations.append(KeywordIdea(
            text=term,
            monthly_searches=0,  # No metrics as requested
            competition="UNSPECIFIED",
            competition_index=None,
            cpc_low=0.0,
            cpc_high=0.0
        ))
        
        # Add variations with suffixes
        for s in suffixes[:4]:  # Limit suffixes to avoid too many variations
            variations.append(KeywordIdea(
                text=f"{term} {s}",
                monthly_searches=0,
                competition="UNSPECIFIED",
                competition_index=None,
                cpc_low=0.0,
                cpc_high=0.0
            ))
    
    # Remove duplicates and return up to 25 keywords
    seen = set()
    unique_variations = []
    for kw in variations:
        if kw.text.lower() not in seen:
            seen.add(kw.text.lower())
            unique_variations.append(kw)
    
    return unique_variations[:25]


@router.post("/keywords/ideas", response_model=KeywordIdeasResponse)
async def keywords_ideas(req: KeywordIdeasRequest) -> KeywordIdeasResponse:
    """Get keyword suggestions using Google Ads API."""
    logger.info(f"Keyword ideas request: {req.model_dump()}")

    # Validate input
    if not req.url and not req.product_description and not req.seed_keywords:
        raise HTTPException(
            status_code=400, 
            detail="At least one of url, product_description, or seed_keywords must be provided"
        )

    # Only proceed if Google Ads service is available
    if not google_ads_service:
        raise HTTPException(
            status_code=503,
            detail="Google Ads API service is not available. Please check configuration."
        )

    try:
        logger.info("Using Google Ads API for keyword generation")
        
        # Determine which Google Ads API feature to use based on input
        if req.url and req.product_description:
            # Both URL and product description provided - use keyword_and_url_seed
            logger.info("Using keyword_and_url_seed feature")
            keyword_data = google_ads_service.generate_keywords_from_url(
                url=req.url,
                product_description=req.product_description,
                language=req.language,
                location=_get_geo_target_id(req.geo),
                max_keywords=25
            )
        elif req.url:
            # Only URL provided - use url_seed
            logger.info("Using url_seed feature")
            keyword_data = google_ads_service.generate_keywords_from_url(
                url=req.url,
                product_description="",  # Empty to trigger url_seed
                language=req.language,
                location=_get_geo_target_id(req.geo),
                max_keywords=25
            )
        elif req.product_description:
            # Only product description provided - use keyword_seed
            logger.info("Using keyword_seed feature")
            keyword_data = google_ads_service.generate_keywords_from_url(
                url="",  # Empty to trigger keyword_seed
                product_description=req.product_description,
                language=req.language,
                location=_get_geo_target_id(req.geo),
                max_keywords=25
            )
        else:
            # This should not happen due to validation above, but just in case
            raise HTTPException(
                status_code=400,
                detail="No valid input provided for keyword generation"
            )
        
        # Convert to KeywordIdea format
        keywords = []
        for kw_data in keyword_data:
            keywords.append(KeywordIdea(
                text=kw_data['text'],
                monthly_searches=kw_data.get('avg_monthly_searches', 0),
                competition=kw_data.get('competition', 'UNKNOWN'),
                competition_index=kw_data.get('competition_index'),
                cpc_low=kw_data.get('low_top_of_page_bid_micros', 0) / 1_000_000,  # Convert from micros to dollars
                cpc_high=kw_data.get('high_top_of_page_bid_micros', 0) / 1_000_000  # Convert from micros to dollars
            ))
        
        logger.info(f"Generated {len(keywords)} keywords using Google Ads API")
        return KeywordIdeasResponse(
            keywords=keywords,
            cached=False,
            source="google_ads_api"
        )
        
    except Exception as e:
        logger.error(f"Google Ads API failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate keywords using Google Ads API: {str(e)}"
        )


def _get_geo_target_id(geo_code: str) -> str:
    """Convert geo code to Google Ads geo target ID."""
    geo_mapping = {
        "US": "2840",  # United States
        "CA": "2124",  # Canada
        "GB": "2826",  # United Kingdom
        "AU": "2036",  # Australia
        "DE": "2764",  # Germany
        "FR": "250",   # France
        "IT": "380",   # Italy
        "ES": "724",   # Spain
        "NL": "528",   # Netherlands
        "SE": "752",   # Sweden
        "NO": "578",   # Norway
        "DK": "208",   # Denmark
        "FI": "246",   # Finland
        "PL": "616",   # Poland
        "BR": "76",    # Brazil
        "MX": "484",   # Mexico
        "IN": "356",   # India
        "JP": "392",   # Japan
        "KR": "410",   # South Korea
        "CN": "156",   # China
        "SG": "702",   # Singapore
        "HK": "344",   # Hong Kong
        "TW": "158",   # Taiwan
        "TH": "764",   # Thailand
        "MY": "458",   # Malaysia
        "ID": "360",   # Indonesia
        "PH": "608",   # Philippines
        "VN": "704",   # Vietnam
        "ZA": "710",   # South Africa
        "EG": "818",   # Egypt
        "NG": "566",   # Nigeria
        "KE": "404",   # Kenya
        "IL": "376",   # Israel
        "AE": "784",   # United Arab Emirates
        "SA": "682",   # Saudi Arabia
        "TR": "792",   # Turkey
        "RU": "643",   # Russia
    }
    return geo_mapping.get(geo_code.upper(), "2840")  # Default to US


@router.post("/keywords/historical-metrics", response_model=HistoricalMetricsResponse)
async def get_historical_metrics(req: HistoricalMetricsRequest) -> HistoricalMetricsResponse:
    """Get historical metrics (search volume & CPC) for keywords using GenerateKeywordHistoricalMetrics."""
    logger.info(f"Historical metrics request: {req.model_dump()}")

    # Validate input
    if not req.keywords:
        raise HTTPException(
            status_code=400, 
            detail="At least one keyword must be provided"
        )

    # Try to use Google Ads API first
    if google_ads_service:
        try:
            logger.info("Using Google Ads API for historical metrics")
            
            # Get historical metrics using Google Ads API
            metrics_data = google_ads_service.get_historical_metrics(
                keywords=req.keywords,
                language=req.language,
                location=_get_geo_target_id(req.geo),
                date_range=req.date_range
            )
            
            # Convert to HistoricalMetric format
            metrics = []
            for metric_data in metrics_data:
                metrics.append(HistoricalMetric(
                    keyword=metric_data['keyword'],
                    avg_monthly_searches=metric_data['avg_monthly_searches'],
                    competition=metric_data['competition'],
                    competition_index=metric_data.get('competition_index'),
                    low_cpc=metric_data['low_top_of_page_bid_micros'] / 1_000_000,  # Convert to dollars
                    high_cpc=metric_data['high_top_of_page_bid_micros'] / 1_000_000,
                    avg_cpc=(metric_data['low_top_of_page_bid_micros'] + metric_data['high_top_of_page_bid_micros']) / 2_000_000
                ))
            
            logger.info(f"Retrieved historical metrics for {len(metrics)} keywords using Google Ads API")
            return HistoricalMetricsResponse(
                metrics=metrics,
                cached=False,
                source="google_ads_api"
            )
            
        except Exception as e:
            logger.error(f"Google Ads API failed: {e}")
            logger.info("Falling back to mock data generation")
    
    # Fallback to mock data generation
    logger.info("Generating mock historical metrics")
    metrics = []
    
    import random
    for keyword in req.keywords:
        # Use keyword hash for deterministic results
        random.seed(hash(keyword) % (2**32))
        
        competition_levels = ['LOW', 'MEDIUM', 'HIGH']
        low_cpc = random.uniform(0.5, 2.0)
        high_cpc = random.uniform(2.0, 10.0)
        
        metrics.append(HistoricalMetric(
            keyword=keyword,
            avg_monthly_searches=random.randint(100, 50000),
            competition=random.choice(competition_levels),
            competition_index=random.randint(0, 100),
            low_cpc=low_cpc,
            high_cpc=high_cpc,
            avg_cpc=(low_cpc + high_cpc) / 2
        ))
    
    return HistoricalMetricsResponse(
        metrics=metrics,
        cached=False,
        source="mock"
    )


@router.post("/keywords/forecast-metrics", response_model=ForecastMetricsResponse)
async def get_forecast_metrics(req: ForecastMetricsRequest) -> ForecastMetricsResponse:
    """Get performance projections for keywords using GenerateForecastMetrics."""
    logger.info(f"Forecast metrics request: {req.model_dump()}")

    # Validate input
    if not req.keywords:
        raise HTTPException(
            status_code=400, 
            detail="At least one keyword must be provided"
        )

    # Try to use Google Ads API first
    if google_ads_service:
        try:
            logger.info("Using Google Ads API for forecast metrics")
            
            # Get forecast metrics using Google Ads API
            forecast_data = google_ads_service.get_forecast_metrics(
                keywords=req.keywords,
                campaign_budget=req.campaign_budget,
                language=req.language,
                location=_get_geo_target_id(req.geo),
                bidding_strategy=req.bidding_strategy
            )
            
            # Convert to response format
            keyword_forecasts = []
            for kw_data in forecast_data['keywords']:
                keyword_forecasts.append(KeywordForecast(
                    keyword=kw_data['keyword'],
                    impressions=kw_data['impressions'],
                    clicks=kw_data['clicks'],
                    cost=kw_data['cost_micros'] / 1_000_000,  # Convert to dollars
                    conversions=kw_data['conversions'],
                    ctr=kw_data['ctr'],
                    cvr=kw_data['cvr']
                ))
            
            campaign_forecast = CampaignForecast(
                total_impressions=forecast_data['campaign_forecast']['total_impressions'],
                total_clicks=forecast_data['campaign_forecast']['total_clicks'],
                total_cost=forecast_data['campaign_forecast']['total_cost_micros'] / 1_000_000,
                total_conversions=forecast_data['campaign_forecast']['total_conversions'],
                avg_ctr=forecast_data['campaign_forecast']['avg_ctr'],
                avg_cvr=forecast_data['campaign_forecast']['avg_cvr']
            )
            
            logger.info(f"Retrieved forecast metrics for {len(keyword_forecasts)} keywords using Google Ads API")
            return ForecastMetricsResponse(
                keywords=keyword_forecasts,
                campaign_forecast=campaign_forecast,
                budget_utilization=forecast_data['budget_utilization'],
                cached=False,
                source="google_ads_api"
            )
            
        except Exception as e:
            logger.error(f"Google Ads API failed: {e}")
            logger.info("Falling back to mock data generation")
    
    # Fallback to mock data generation
    logger.info("Generating mock forecast metrics")
    keyword_forecasts = []
    total_impressions = 0
    total_clicks = 0
    total_cost = 0.0
    total_conversions = 0
    
    import random
    for keyword in req.keywords:
        # Use keyword hash for deterministic results
        random.seed(hash(keyword) % (2**32))
        
        impressions = random.randint(1000, 10000)
        ctr = random.uniform(0.01, 0.05)
        clicks = int(impressions * ctr)
        avg_cpc = random.uniform(1.0, 5.0)
        cost = clicks * avg_cpc
        cvr = random.uniform(0.02, 0.08)
        conversions = int(clicks * cvr)
        
        keyword_forecasts.append(KeywordForecast(
            keyword=keyword,
            impressions=impressions,
            clicks=clicks,
            cost=cost,
            conversions=conversions,
            ctr=ctr,
            cvr=cvr
        ))
        
        total_impressions += impressions
        total_clicks += clicks
        total_cost += cost
        total_conversions += conversions
    
    campaign_forecast = CampaignForecast(
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        total_cost=total_cost,
        total_conversions=total_conversions,
        avg_ctr=total_clicks / total_impressions if total_impressions > 0 else 0,
        avg_cvr=total_conversions / total_clicks if total_clicks > 0 else 0
    )
    
    budget_utilization = total_cost / req.campaign_budget if req.campaign_budget > 0 else 0
    
    return ForecastMetricsResponse(
        keywords=keyword_forecasts,
        campaign_forecast=campaign_forecast,
        budget_utilization=budget_utilization,
        cached=False,
        source="mock"
    )


@router.get("/keywords/test")
async def test_keywords_api():
    """Test endpoint to verify Google Ads API integration."""
    try:
        if not google_ads_service:
            return {
                "status": "error",
                "message": "Google Ads service not initialized",
                "google_ads_available": False
            }
        
        # Test with a simple keyword generation
        test_keywords = google_ads_service.generate_keywords_from_url(
            url="https://example.com",
            product_description="digital marketing services",
            language="en",
            location="2840",  # US
            max_keywords=5
        )
        
        return {
            "status": "success",
            "message": "Google Ads API integration working",
            "google_ads_available": True,
            "test_keywords_count": len(test_keywords),
            "sample_keywords": [kw['text'] for kw in test_keywords[:3]],
            "service_initialized": True
        }
        
    except Exception as e:
        logger.error(f"Google Ads API test failed: {e}")
        return {
            "status": "error",
            "message": f"Google Ads API test failed: {str(e)}",
            "google_ads_available": False,
            "error": str(e)
        }
