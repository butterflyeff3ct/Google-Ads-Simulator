"""
Enhanced Simulation API - Volume-Based Logic

This module implements the enhanced simulation API that uses:
1. Volume-based auction estimation instead of random counts
2. Enhanced Quality Score calculation from campaign context
3. Match type impact on CTR and auction participation
4. Geographic modifiers for location targeting
5. Campaign objective-driven conversion modeling
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import numpy as np
import uuid

# Import enhanced modules
from app.core.enhanced_auction import (
    simulate_volume_based_auctions,
    calculate_enhanced_ctr,
    calculate_enhanced_cvr,
    calculate_enhanced_quality_score
)
from app.core.bidding import apply_bidding_strategy
from app.core.pacing import distribute_budget_by_hour, calculate_budget_utilization
from app.core.constants import SIM_VERSION
from app.core.volume_estimation import volume_engine

# Import utilities
from app.utils.cache import generate_cache_key, get_cached_result, set_cached_result
from app.utils.quota import check_quota_available, increment_quota
from app.utils.logger import log_simulation_run

router = APIRouter()


class Keyword(BaseModel):
    text: str
    match_type: str = Field(default="phrase", pattern="^(exact|phrase|broad)$")
    bid: float = Field(gt=0, description="Bid must be positive")
    quality_score: Optional[int] = Field(ge=1, le=10, default=None)


class Campaign(BaseModel):
    name: str
    type: str = Field(default="search")
    daily_budget: float = Field(gt=0)
    bidding_strategy: str = Field(
        default="manual_cpc",
        pattern="^(manual_cpc|target_cpa|target_roas|maximize_clicks|target_impression_share)$"
    )


class CampaignContext(BaseModel):
    """Enhanced campaign context for better simulation"""
    goal: Optional[str] = None
    reach_methods: Optional[List[str]] = None
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    locations: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None
    bidding_details: Optional[Dict[str, Any]] = None
    content: Optional[Dict[str, Any]] = None


class SimulationSettings(BaseModel):
    geo: str = "US"
    language: str = "en"
    num_auctions: int = Field(default=10000, ge=100, le=100000)
    base_cvr: float = Field(default=0.03, ge=0.001, le=0.5)
    pacing_type: str = Field(default="standard", pattern="^(standard|accelerated|conservative)$")


class EnhancedSimulationRequest(BaseModel):
    campaign: Campaign
    keywords: List[Keyword]
    settings: SimulationSettings
    seed: Optional[int] = 12345
    debug: bool = False
    
    # Optional bidding strategy parameters
    target_cpa: Optional[float] = None
    target_roas: Optional[float] = None
    conversion_value: Optional[float] = None
    
    # Enhanced campaign context
    campaign_context: Optional[CampaignContext] = None


class KeywordResult(BaseModel):
    text: str
    match_type: str
    impressions: int
    clicks: int
    ctr: float
    avg_position: float
    avg_cpc: float
    cost: float
    conversions: int
    cvr: float
    cost_per_conversion: Optional[float]
    quality_score: int
    daily_auctions: int
    volume_source: str
    competition_level: str


class SimulationResponse(BaseModel):
    run_id: str
    sim_version: str
    metrics: Dict[str, Any]
    by_keyword: List[KeywordResult]
    duration_ms: int
    cached: bool = False
    volume_analysis: Dict[str, Any]


@router.post("/simulate-enhanced", response_model=SimulationResponse)
async def run_enhanced_simulation(request: EnhancedSimulationRequest):
    """
    Run an enhanced deterministic search ad auction simulation
    
    This endpoint uses volume-based auction estimation and enhanced logic:
    1. Estimates daily auctions based on search volume data
    2. Calculates Quality Score from campaign context
    3. Applies match type and geographic modifiers
    4. Uses campaign objective for conversion modeling
    5. Provides detailed volume analysis
    
    Returns:
        - Aggregated campaign metrics with volume analysis
        - Per-keyword breakdown with auction estimates
        - Execution time and caching status
    """
    start_time = time.time()
    
    # TODO: Get user_id from auth token
    user_id = "demo_user"
    
    # Check quota
    if not check_quota_available(user_id, "simulate", required=1):
        raise HTTPException(
            status_code=429,
            detail="Daily simulation quota exceeded. Try again tomorrow."
        )
    
    # Ensure seed is valid
    base_seed = request.seed if request.seed is not None else 12345
    base_seed = abs(base_seed) % (2**32 - 1)
    
    # Generate cache key
    cache_key = generate_cache_key(request.dict(), base_seed)
    
    # Check cache
    cached_result = get_cached_result(cache_key)
    if cached_result and not request.debug:
        cached_result['cached'] = True
        return SimulationResponse(**cached_result)
    
    # Prepare keyword data with enhanced Quality Score calculation
    keywords_data = []
    campaign_context_dict = request.campaign_context.dict() if request.campaign_context else {}
    
    for kw in request.keywords:
        # Calculate enhanced Quality Score if not provided
        if kw.quality_score is None:
            quality_score = calculate_enhanced_quality_score(
                keyword=kw.text,
                match_type=kw.match_type,
                campaign_context=campaign_context_dict
            )
        else:
            quality_score = kw.quality_score
        
        keywords_data.append({
            'text': kw.text,
            'bid': kw.bid,
            'quality_score': quality_score,
            'match_type': kw.match_type,
            'geo': request.settings.geo,
            'campaign_context': campaign_context_dict
        })
    
    # Apply bidding strategy adjustments
    for kw_data in keywords_data:
        if request.campaign.bidding_strategy != "manual_cpc":
            adjusted_bid = apply_bidding_strategy(
                strategy=request.campaign.bidding_strategy,
                base_bid=kw_data['bid'],
                target_cpa=request.target_cpa,
                target_roas=request.target_roas,
                conversion_value=request.conversion_value,
                daily_budget=request.campaign.daily_budget,
                estimated_clicks=100,  # Will be updated after auction simulation
                avg_cpc=kw_data['bid'],
                historical_cvr=request.settings.base_cvr
            )
            kw_data['bid'] = adjusted_bid
    
    # Run enhanced auction simulation
    auction_results = simulate_volume_based_auctions(
        keywords=keywords_data,
        geo=request.settings.geo,
        campaign_context=campaign_context_dict,
        seed=base_seed
    )
    
    # Aggregate results by keyword
    keyword_stats = {}
    total_daily_auctions = 0
    
    for result in auction_results:
        kw_text = result['keyword']
        
        if kw_text not in keyword_stats:
            # Get volume data for this keyword
            volume_data = volume_engine.get_volume_data(kw_text)
            competition_level = volume_engine.get_competition_level(kw_text)
            
            keyword_stats[kw_text] = {
                'text': kw_text,
                'match_type': result['match_type'],
                'impressions': 0,
                'positions': [],
                'cpcs': [],
                'quality_score': result['quality_score'],
                'competition_level': competition_level,
                'volume_data': volume_data
            }
        
        keyword_stats[kw_text]['impressions'] += 1
        keyword_stats[kw_text]['positions'].append(result['position'])
        keyword_stats[kw_text]['cpcs'].append(result['cpc'])
    
    # Calculate metrics for each keyword
    keyword_results = []
    total_impressions = 0
    total_clicks = 0
    total_cost = 0.0
    total_conversions = 0
    
    for kw_text, stats in keyword_stats.items():
        impressions = stats['impressions']
        avg_position = np.mean(stats['positions']) if stats['positions'] else 0
        avg_cpc = np.mean(stats['cpcs']) if stats['cpcs'] else 0
        
        # Calculate enhanced CTR
        ctr = calculate_enhanced_ctr(
            position=int(avg_position),
            quality_score=stats['quality_score'],
            match_type=stats['match_type'],
            keyword=kw_text,
            campaign_context=campaign_context_dict,
            seed=base_seed + hash(kw_text) % 1000
        )
        
        clicks = int(impressions * ctr)
        
        # Calculate enhanced CVR
        cvr = calculate_enhanced_cvr(
            quality_score=stats['quality_score'],
            campaign_context=campaign_context_dict,
            base_cvr=request.settings.base_cvr,
            seed=base_seed + hash(kw_text) % 1000
        )
        
        conversions = int(clicks * cvr)
        cost = clicks * avg_cpc
        
        # Get volume analysis data
        volume_data = stats['volume_data']
        if volume_data:
            daily_auctions = int(volume_data.monthly_searches / 30)
            volume_source = 'static'
        else:
            # Estimate daily auctions
            from app.core.volume_estimation import estimate_keyword_auctions
            auction_estimate = estimate_keyword_auctions(kw_text, stats['match_type'], request.settings.geo)
            daily_auctions = auction_estimate.daily_auctions
            volume_source = auction_estimate.volume_source
        
        total_daily_auctions += daily_auctions
        
        cost_per_conversion = cost / conversions if conversions > 0 else None
        
        keyword_results.append(KeywordResult(
            text=kw_text,
            match_type=stats['match_type'],
            impressions=impressions,
            clicks=clicks,
            ctr=ctr,
            avg_position=round(avg_position, 2),
            avg_cpc=round(avg_cpc, 2),
            cost=round(cost, 2),
            conversions=conversions,
            cvr=cvr,
            cost_per_conversion=round(cost_per_conversion, 2) if cost_per_conversion else None,
            quality_score=stats['quality_score'],
            daily_auctions=daily_auctions,
            volume_source=volume_source,
            competition_level=stats['competition_level']
        ))
        
        total_impressions += impressions
        total_clicks += clicks
        total_cost += cost
        total_conversions += conversions
    
    # Calculate campaign-level metrics
    avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
    avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
    avg_cpc = total_cost / total_clicks if total_clicks > 0 else 0
    avg_cpa = total_cost / total_conversions if total_conversions > 0 else 0
    
    # Budget utilization
    daily_budget = request.campaign.daily_budget
    budget_utilization = min(100.0, (total_cost / daily_budget) * 100) if daily_budget > 0 else 0
    
    # Volume analysis
    volume_analysis = {
        'total_daily_auctions': total_daily_auctions,
        'avg_auctions_per_keyword': total_daily_auctions / len(keyword_results) if keyword_results else 0,
        'high_volume_keywords': len([kw for kw in keyword_results if kw.daily_auctions > 1000]),
        'medium_volume_keywords': len([kw for kw in keyword_results if 100 <= kw.daily_auctions <= 1000]),
        'low_volume_keywords': len([kw for kw in keyword_results if kw.daily_auctions < 100]),
        'competition_distribution': {
            'high': len([kw for kw in keyword_results if kw.competition_level == 'High']),
            'medium': len([kw for kw in keyword_results if kw.competition_level == 'Medium']),
            'low': len([kw for kw in keyword_results if kw.competition_level == 'Low'])
        }
    }
    
    # Create response
    run_id = str(uuid.uuid4())
    duration_ms = int((time.time() - start_time) * 1000)
    
    response_data = {
        'run_id': run_id,
        'sim_version': SIM_VERSION,
        'metrics': {
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'total_cost': round(total_cost, 2),
            'total_conversions': total_conversions,
            'avg_ctr': round(avg_ctr, 4),
            'avg_cvr': round(avg_cvr, 4),
            'avg_cpc': round(avg_cpc, 2),
            'avg_cpa': round(avg_cpa, 2),
            'budget_utilization': round(budget_utilization, 2),
            'daily_budget': daily_budget,
            'campaign_name': request.campaign.name,
            'bidding_strategy': request.campaign.bidding_strategy,
            'geo_targeting': request.settings.geo,
            'language_targeting': request.settings.language
        },
        'by_keyword': keyword_results,
        'duration_ms': duration_ms,
        'cached': False,
        'volume_analysis': volume_analysis
    }
    
    # Cache the result
    set_cached_result(cache_key, response_data)
    
    # Log the simulation run
    log_simulation_run(
        user_id=user_id,
        run_id=run_id,
        campaign_name=request.campaign.name,
        keywords_count=len(keyword_results),
        total_cost=total_cost,
        duration_ms=duration_ms
    )
    
    # Increment quota
    increment_quota(user_id, "simulate", 1)
    
    return SimulationResponse(**response_data)


# Legacy endpoint for backward compatibility
@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation_legacy(request: EnhancedSimulationRequest):
    """
    Legacy simulation endpoint - redirects to enhanced version
    """
    return await run_enhanced_simulation(request)
