"""
Simulation API Endpoints - Full Implementation
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import numpy as np

# Import core modules
from app.core.auction import simulate_multiple_auctions
from app.core.ctr_model import calculate_ctr, calculate_cvr
from app.core.bidding import apply_bidding_strategy
from app.core.pacing import distribute_budget_by_hour, calculate_budget_utilization
from app.core.constants import SIM_VERSION

# Import utilities
from app.utils.cache import generate_cache_key, get_cached_result, set_cached_result
from app.utils.quota import check_quota_available, increment_quota
from app.utils.logger import log_simulation_run

router = APIRouter()


class Keyword(BaseModel):
    text: str
    match_type: str = Field(default="phrase", pattern="^(exact|phrase|broad)$")
    bid: float = Field(gt=0, description="Bid must be positive")
    quality_score: int = Field(ge=1, le=10, default=7)


class Campaign(BaseModel):
    name: str
    type: str = Field(default="search")
    daily_budget: float = Field(gt=0)
    bidding_strategy: str = Field(
        default="manual_cpc",
        pattern="^(manual_cpc|target_cpa|target_roas|maximize_clicks|target_impression_share)$"
    )


class SimulationSettings(BaseModel):
    geo: str = "US"
    language: str = "en"
    num_auctions: int = Field(default=10000, ge=100, le=100000)
    base_cvr: float = Field(default=0.03, ge=0.001, le=0.5)
    pacing_type: str = Field(default="standard", pattern="^(standard|accelerated|conservative)$")


class SimulationRequest(BaseModel):
    campaign: Campaign
    keywords: List[Keyword]
    settings: SimulationSettings
    seed: Optional[int] = 12345
    debug: bool = False
    
    # Optional bidding strategy parameters
    target_cpa: Optional[float] = None
    target_roas: Optional[float] = None
    conversion_value: Optional[float] = None


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


class SimulationResponse(BaseModel):
    run_id: str
    sim_version: str
    metrics: Dict[str, Any]
    by_keyword: List[KeywordResult]
    duration_ms: int
    cached: bool = False


@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run a deterministic search ad auction simulation
    
    This endpoint:
    1. Checks quota availability
    2. Checks cache for identical requests
    3. Runs auction simulation with deterministic logic
    4. Calculates CTR, CVR, and cost metrics
    5. Applies budget pacing
    6. Returns comprehensive results
    
    Returns:
        - Aggregated campaign metrics
        - Per-keyword breakdown
        - Execution time
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
    # Ensure seed is within numpy's valid range (0 to 2^32 - 1)
    base_seed = abs(base_seed) % (2**32 - 1)
    
    # Generate cache key
    cache_key = generate_cache_key(request.dict(), base_seed)
    
    # Check cache
    cached_result = get_cached_result(cache_key)
    if cached_result and not request.debug:
        cached_result['cached'] = True
        return SimulationResponse(**cached_result)
    
    # Prepare keyword data
    keywords_data = [
        {
            'text': kw.text,
            'bid': kw.bid,
            'quality_score': kw.quality_score,
            'match_type': kw.match_type
        }
        for kw in request.keywords
    ]
    
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
                estimated_clicks=request.settings.num_auctions // 10,
                avg_cpc=kw_data['bid'],
                historical_cvr=request.settings.base_cvr
            )
            kw_data['bid'] = adjusted_bid
    
    # Run auction simulation
    auction_results = simulate_multiple_auctions(
        keywords=keywords_data,
        num_auctions=request.settings.num_auctions,
        seed=base_seed
    )
    
    # Aggregate results by keyword
    keyword_stats = {}
    
    for result in auction_results:
        kw_text = result['keyword']
        
        if kw_text not in keyword_stats:
            keyword_stats[kw_text] = {
                'text': kw_text,
                'impressions': 0,
                'positions': [],
                'cpcs': [],
                'quality_score': result['quality_score']
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
    
    np.random.seed(base_seed)
    
    for kw_text, stats in keyword_stats.items():
        # Find original keyword data
        original_kw = next(k for k in keywords_data if k['text'] == kw_text)
        
        impressions = stats['impressions']
        avg_position = float(np.mean(stats['positions']))
        avg_cpc = float(np.mean(stats['cpcs']))
        
        # Calculate CTR based on average position
        ctr = calculate_ctr(
            keyword=kw_text,
            match_type=original_kw['match_type'],
            position=int(round(avg_position)),
            quality_score=stats['quality_score'],
            device_type="desktop",
            extensions=[]
        )
        
        # Calculate clicks
        clicks = int(impressions * ctr)
        
        # Calculate cost
        cost = float(clicks * avg_cpc)
        
        # Calculate conversions
        cvr = calculate_cvr(
            campaign_objective="sales",  # Default campaign objective
            lp_score=0.7,  # Default landing page score
            quality_score=stats['quality_score'],
            position=int(round(avg_position))
        )
        conversions = int(clicks * cvr)
        
        # Cost per conversion
        cost_per_conv = float(cost / conversions) if conversions > 0 else None
        
        keyword_results.append(KeywordResult(
            text=kw_text,
            match_type=original_kw['match_type'],
            impressions=int(impressions),
            clicks=int(clicks),
            ctr=round(float(ctr), 4),
            avg_position=round(float(avg_position), 2),
            avg_cpc=round(float(avg_cpc), 2),
            cost=round(float(cost), 2),
            conversions=int(conversions),
            cvr=round(float(cvr), 4),
            cost_per_conversion=round(float(cost_per_conv), 2) if cost_per_conv else None
        ))
        
        # Accumulate totals
        total_impressions += impressions
        total_clicks += clicks
        total_cost += cost
        total_conversions += conversions
    
    # Apply budget constraints
    if total_cost > request.campaign.daily_budget:
        # Scale down proportionally
        scale_factor = request.campaign.daily_budget / total_cost
        
        for kw_result in keyword_results:
            kw_result.clicks = int(kw_result.clicks * scale_factor)
            kw_result.cost = round(kw_result.cost * scale_factor, 2)
            kw_result.conversions = int(kw_result.conversions * scale_factor)
        
        # Recalculate totals
        total_clicks = sum(kw.clicks for kw in keyword_results)
        total_cost = sum(kw.cost for kw in keyword_results)
        total_conversions = sum(kw.conversions for kw in keyword_results)
    
    # Calculate aggregate metrics
    avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
    avg_cpc = total_cost / total_clicks if total_clicks > 0 else 0
    avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
    avg_position = float(np.mean([kw.avg_position for kw in keyword_results]))
    
    # Budget utilization
    budget_util = calculate_budget_utilization(
        spent=total_cost,
        budget=request.campaign.daily_budget,
        hours_elapsed=24,
        total_hours=24
    )
    
    metrics = {
        "impressions": int(total_impressions),
        "clicks": int(total_clicks),
        "ctr": round(float(avg_ctr), 4),
        "avg_cpc": round(float(avg_cpc), 2),
        "cost": round(float(total_cost), 2),
        "conversions": int(total_conversions),
        "cvr": round(float(avg_cvr), 4),
        "avg_position": round(float(avg_position), 2),
        "budget_utilization": budget_util
    }
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    # Build response
    response_data = {
        "run_id": cache_key[:16],
        "sim_version": SIM_VERSION,
        "metrics": metrics,
        "by_keyword": [kw.dict() for kw in keyword_results],
        "duration_ms": duration_ms,
        "cached": False
    }
    
    # Cache the result
    set_cached_result(cache_key, response_data)
    
    # Increment quota
    increment_quota(user_id, "simulate", 1)
    
    # Log the simulation
    log_simulation_run(
        run_id=cache_key[:16],
        seed=request.seed,
        duration_ms=duration_ms,
        num_keywords=len(request.keywords)
    )
    
    return SimulationResponse(**response_data)


@router.get("/results/{run_id}")
async def get_results(run_id: str):
    """
    Retrieve simulation results by run_id.
    
    First, attempt to load from cache store used by cached simulations.
    Fallback to placeholder response if not found.
    """
    try:
        # Prefer cached-simulate persisted payloads
        data = get_cached_result(f"results:{run_id}")
        if data:
            return data
    except Exception:
        pass
    
    return {
        "run_id": run_id,
        "status": "completed",
        "message": "Database integration pending"
    }


@router.get("/quota")
async def get_quota_status():
    """
    Get current user's quota status
    """
    from app.utils.quota import get_quota_status
    
    # TODO: Get actual user_id from auth
    user_id = "demo_user"
    
    return get_quota_status(user_id)
