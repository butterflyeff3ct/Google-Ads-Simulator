"""
Cached Simulation API Endpoint

This module provides API endpoints for cached, deterministic simulations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import uuid

from app.core.cached_simulation import (
    run_deterministic_simulation, run_reproducible_simulation,
    get_simulation_cache_stats, cached_simulation_service
)
from app.api.simulate import Keyword, Campaign, SimulationSettings
from app.utils.cache import set_cached_result, get_cached_result

logger = logging.getLogger(__name__)

router = APIRouter()

class DailyPoint(BaseModel):
    """User-provided time series daily point"""
    date: str
    clicks: int = Field(ge=0)
    impressions: int = Field(ge=0)
    cost: float = Field(ge=0)
    cpc: float = Field(ge=0)
    conversions: int = Field(ge=0, default=0)

class SeriesData(BaseModel):
    """User-provided segmented series"""
    series: str
    data: List[DailyPoint]

class CachedSimulationRequest(BaseModel):
    """Request model for cached simulation"""
    campaign: Campaign
    keywords: List[Keyword]
    settings: SimulationSettings
    seed: Optional[int] = 12345
    use_cache: bool = True
    cache_ttl_hours: int = 24
    campaign_context: Optional[Dict[str, Any]] = None
    # Optional user-provided time series to drive line graph visualization
    user_timeseries: Optional[List[DailyPoint]] = None
    # Optional segmented series (e.g., by match_type/device)
    user_series: Optional[List[SeriesData]] = None
    start_date: Optional[str] = None  # ISO 8601 date
    end_date: Optional[str] = None    # ISO 8601 date
    timezone: Optional[str] = "UTC"
    granularity: Optional[str] = Field(default="daily", pattern="^(daily|weekly)$")
    # Request server-generated breakdown series
    breakdown_by: Optional[List[str]] = None  # e.g., ["match_type", "device"]

class ReproducibleSimulationRequest(BaseModel):
    """Request model for reproducible simulation"""
    campaign: Campaign
    keywords: List[Keyword]
    settings: SimulationSettings
    seed: Optional[int] = 12345
    campaign_context: Optional[Dict[str, Any]] = None

class SimulationResponse(BaseModel):
    """Response model for simulation results"""
    results: List[Dict[str, Any]]
    cache_hit: bool
    cache_key: Optional[str] = None
    cached_at: Optional[str] = None
    simulated_at: str
    seed: int
    geo: str
    total_keywords: int
    config: Dict[str, Any]

@router.post("/cached-simulate")
async def run_cached_simulation(request: CachedSimulationRequest):
    """
    Run simulation with caching for deterministic results
    
    This endpoint ensures reproducible simulations by caching results
    based on configuration hashes. Returns data in frontend-compatible format.
    """
    try:
        # Convert keywords to dictionary format
        keywords_data = [
            {
                'text': kw.text,
                'bid': kw.bid,
                'quality_score': kw.quality_score,
                'match_type': kw.match_type
            }
            for kw in request.keywords
        ]
        
        # Extract geo from settings or use default
        geo = getattr(request.settings, 'geo', 'US')
        
        # Run cached simulation
        print(f"DEBUG: Running simulation with seed: {request.seed}, cache enabled: {request.use_cache}")
        result = run_deterministic_simulation(
            keywords=keywords_data,
            geo=geo,
            campaign_context=request.campaign_context,
            seed=request.seed,
            use_cache=request.use_cache
        )
        print(f"DEBUG: Cache hit: {result.get('cache_hit', False)}")
        
        # Aggregate auction results into keyword-level statistics
        from collections import defaultdict
        from app.core.ctr_model import calculate_ctr
        from app.core.ctr_model import simulate_cvr
        
        # Create keyword lookup from original request
        keyword_lookup = {kw['text']: kw for kw in keywords_data}
        
        keyword_stats = defaultdict(lambda: {
            'impressions': 0,
            'positions': [],
            'cpcs': [],
            'quality_score': 7,
            'match_type': 'phrase'
        })
        
        # Aggregate by keyword
        for auction_result in result['results']:
            kw_text = auction_result['keyword']
            keyword_stats[kw_text]['impressions'] += 1
            keyword_stats[kw_text]['positions'].append(auction_result['position'])
            keyword_stats[kw_text]['cpcs'].append(auction_result['cpc'])
            
            # Get original keyword data (only set once)
            if kw_text in keyword_lookup:
                original_kw = keyword_lookup[kw_text]
                keyword_stats[kw_text]['quality_score'] = original_kw['quality_score']
                keyword_stats[kw_text]['match_type'] = original_kw['match_type']
        
        # Calculate metrics for each keyword
        import numpy as np
        aggregated_keywords = []
        total_impressions = 0
        total_clicks = 0
        total_cost = 0.0
        total_conversions = 0
        total_revenue = 0.0
        
        for kw_text, stats in keyword_stats.items():
            impressions = stats['impressions']
            avg_position = float(np.mean(stats['positions']))
            avg_cpc = float(np.mean(stats['cpcs']))
            quality_score = stats['quality_score']
            match_type = stats['match_type']
            
            # Add keyword-specific variation based on keyword characteristics
            keyword_length_factor = len(kw_text.split()) / 3.0  # Longer keywords = different performance
            keyword_complexity = 1.0 + (len(kw_text) - 10) * 0.02  # Complexity modifier
            
            # Debug logging
            print(f"DEBUG: Keyword '{kw_text}' - QS: {quality_score}, Match: {match_type}, Length: {len(kw_text)}, Complexity: {keyword_complexity:.3f}")
            
            # Calculate CTR based on position with keyword-specific adjustments
            base_ctr = calculate_ctr(
                keyword=kw_text,
                match_type=match_type,
                position=int(round(avg_position)),
                quality_score=quality_score,
                device_type="desktop",
                extensions=[]
            )
            
            # Apply keyword-specific CTR modifiers
            ctr = base_ctr * keyword_complexity * (0.8 + keyword_length_factor * 0.4)
            ctr = min(ctr, 0.25)  # Cap at 25%
            
            # Calculate clicks
            clicks = int(impressions * ctr)
            
            # Calculate cost with keyword-specific CPC variation
            cost = float(clicks * avg_cpc * keyword_complexity)
            
            # Calculate conversions with keyword-specific CVR
            base_cvr = simulate_cvr(
                campaign_objective="sales",
                lp_score=0.7,
                ad_rank=float(quality_score * avg_cpc),
                position=int(round(avg_position))
            )
            
            # Apply keyword-specific CVR modifiers
            cvr = base_cvr * keyword_complexity * (0.7 + keyword_length_factor * 0.6)
            cvr = min(cvr, 1.0)  # Cap at 100%
            conversions = int(clicks * cvr)
            
            # Calculate revenue (assuming $50 average order value)
            revenue = conversions * 50.0
            
            aggregated_keywords.append({
                'text': kw_text,
                'match_type': match_type,
                'impressions': impressions,
                'clicks': clicks,
                'ctr': round(ctr, 4),
                'avg_position': round(avg_position, 2),
                'avg_cpc': round(avg_cpc * keyword_complexity, 2),
                'cost': round(cost, 2),
                'conversions': conversions,
                'cvr': round(cvr, 4),
                'cost_per_conversion': round(cost / conversions, 2) if conversions > 0 else None
            })
            
            # Accumulate totals
            total_impressions += impressions
            total_clicks += clicks
            total_cost += cost
            total_conversions += conversions
            total_revenue += revenue
        
        avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
        avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
        avg_cpc = total_cost / total_clicks if total_clicks > 0 else 0
        avg_cpa = total_cost / total_conversions if total_conversions > 0 else 0
        roas = total_revenue / total_cost if total_cost > 0 else 0
        
        # Calculate average position from keywords
        total_position_sum = sum(r.get('avg_position', 0) * r.get('impressions', 1) for r in aggregated_keywords)
        avg_position = total_position_sum / total_impressions if total_impressions > 0 else 0
        
        # Prefer user-provided time series if present; otherwise generate deterministic trend
        daily_data = []
        timeseries_override_totals = None
        if request.user_timeseries and len(request.user_timeseries) > 0:
            # Validate and normalize user-provided timeseries
            for point in request.user_timeseries:
                daily_data.append({
                    'date': point.date,
                    'clicks': int(point.clicks),
                    'impressions': int(point.impressions),
                    'cost': float(point.cost),
                    'cpc': float(point.cpc),
                    'conversions': int(point.conversions or 0)
                })
            # Compute totals to override campaign-level metrics
            ts_clicks = sum(p['clicks'] for p in daily_data)
            ts_impr = sum(p['impressions'] for p in daily_data)
            ts_cost = sum(float(p['cost']) for p in daily_data)
            ts_conversions = sum(p['conversions'] for p in daily_data)
            timeseries_override_totals = {
                'clicks': ts_clicks,
                'impressions': ts_impr,
                'cost': ts_cost,
                'conversions': ts_conversions
            }
        else:
            # Generate deterministic daily trend data (30 days)
            import hashlib
            days = 30
            base_seed = result['seed']
            for day in range(days):
                # Use seed + day for deterministic but varying daily values
                day_seed = int(hashlib.md5(f"{base_seed}_{day}".encode()).hexdigest()[:8], 16)
                # Create pseudo-random but deterministic variance (-15% to +15%)
                variance = ((day_seed % 1000) / 1000.0 - 0.5) * 0.3  # -0.15 to +0.15
                daily_factor = 1.0 + variance
                
                daily_data.append({
                    'date': f'Day {day + 1}',
                    'clicks': int((total_clicks / days) * daily_factor),
                    'impressions': int((total_impressions / days) * daily_factor),
                    'cost': round((total_cost / days) * daily_factor, 2),
                    'cpc': round(avg_cpc * (0.9 + (day_seed % 100) / 500.0), 2),  # 0.9-1.1x variance
                    'conversions': int((total_conversions / days) * daily_factor)
                })

        # Build segmented trends if provided or requested
        segmented_trends: List[Dict[str, Any]] = []
        if request.user_series and len(request.user_series) > 0:
            # Echo user-provided segmented series
            for s in request.user_series:
                segmented_trends.append({
                    'series': s.series,
                    'data': [
                        {
                            'date': p.date,
                            'clicks': int(p.clicks),
                            'impressions': int(p.impressions),
                            'cost': float(p.cost),
                            'cpc': float(p.cpc),
                            'conversions': int(p.conversions or 0)
                        }
                        for p in s.data
                    ]
                })
            # If no direct user_timeseries, aggregate series into daily_data and compute totals
            if timeseries_override_totals is None:
                from collections import defaultdict
                agg_map: Dict[str, Dict[str, float]] = defaultdict(lambda: {
                    'clicks': 0,
                    'impressions': 0,
                    'cost': 0.0,
                    'conversions': 0,
                    'cpc_sum': 0.0,
                    'cpc_count': 0
                })
                for series in segmented_trends:
                    for p in series['data']:
                        d = agg_map[p['date']]
                        d['clicks'] += int(p['clicks'])
                        d['impressions'] += int(p['impressions'])
                        d['cost'] += float(p['cost'])
                        d['conversions'] += int(p['conversions'])
                        # simple average for cpc across series for this date
                        d['cpc_sum'] += float(p['cpc'])
                        d['cpc_count'] += 1
                daily_data = []
                for date, vals in sorted(agg_map.items(), key=lambda x: x[0]):
                    avg_cpc_day = vals['cpc_sum'] / vals['cpc_count'] if vals['cpc_count'] > 0 else 0.0
                    daily_data.append({
                        'date': date,
                        'clicks': int(vals['clicks']),
                        'impressions': int(vals['impressions']),
                        'cost': round(vals['cost'], 2),
                        'cpc': round(avg_cpc_day, 2),
                        'conversions': int(vals['conversions'])
                    })
                timeseries_override_totals = {
                    'clicks': sum(p['clicks'] for p in daily_data),
                    'impressions': sum(p['impressions'] for p in daily_data),
                    'cost': sum(float(p['cost']) for p in daily_data),
                    'conversions': sum(p['conversions'] for p in daily_data)
                }
        elif request.breakdown_by:
            # Currently support 'match_type' and 'device' (device uses deterministic allocation)
            breakdown_dims = set(request.breakdown_by)
            if 'match_type' in breakdown_dims:
                # Compute share per match_type from aggregated_keywords impressions
                from collections import defaultdict
                mt_impr: Dict[str, int] = defaultdict(int)
                total_impr = 0
                for kw in aggregated_keywords:
                    mt = kw.get('match_type', 'phrase')
                    imp = int(kw.get('impressions', 0))
                    mt_impr[mt] += imp
                    total_impr += imp
                # Avoid division by zero
                if total_impr <= 0:
                    total_impr = 1
                # Build series per match type
                for mt, mt_imp in mt_impr.items():
                    share = mt_imp / total_impr
                    series_data = []
                    for day in daily_data:
                        series_data.append({
                            'date': day['date'],
                            'clicks': int(round(day['clicks'] * share)),
                            'impressions': int(round(day['impressions'] * share)),
                            'cost': round(day['cost'] * share, 2),
                            'cpc': day['cpc'],  # keep same CPC for simplicity
                            'conversions': int(round(day['conversions'] * share))
                        })
                    segmented_trends.append({'series': f'match_type:{mt}', 'data': series_data})
            if 'device' in breakdown_dims:
                # Deterministic device allocation: desktop 60%, mobile 35%, tablet 5%
                device_shares = {'desktop': 0.6, 'mobile': 0.35, 'tablet': 0.05}
                for dev, share in device_shares.items():
                    series_data = []
                    for day in daily_data:
                        series_data.append({
                            'date': day['date'],
                            'clicks': int(round(day['clicks'] * share)),
                            'impressions': int(round(day['impressions'] * share)),
                            'cost': round(day['cost'] * share, 2),
                            'cpc': day['cpc'],
                            'conversions': int(round(day['conversions'] * share))
                        })
                    segmented_trends.append({'series': f'device:{dev}', 'data': series_data})
        
        # If timeseries_override_totals present, override top-level metrics from user data
        if timeseries_override_totals is not None:
            total_clicks = int(timeseries_override_totals['clicks'])
            total_impressions = int(timeseries_override_totals['impressions'])
            total_cost = float(timeseries_override_totals['cost'])
            total_conversions = int(timeseries_override_totals['conversions'])
            avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
            avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
            avg_cpc = total_cost / total_clicks if total_clicks > 0 else 0
            avg_cpa = total_cost / total_conversions if total_conversions > 0 else 0
            total_revenue = total_conversions * 50.0
            # Recompute avg_position only if available; otherwise leave as previously computed
            total_position_sum = sum(r.get('avg_position', 0) * r.get('impressions', 1) for r in aggregated_keywords)
            avg_position = total_position_sum / total_impressions if total_impressions > 0 else 0

        # Create run_id and persist results for retrieval via /results/{run_id}
        run_id = (result.get('cache_key') or uuid.uuid4().hex)[:12]
        response_payload = {
            'run_id': run_id,
            'sim_version': '2.0-enhanced',
            'cached': result['cache_hit'],
            'cache_hit': result['cache_hit'],
            'metrics': {
                'impressions': total_impressions,
                'clicks': total_clicks,
                'cost': total_cost,
                'conversions': total_conversions,
                'ctr': avg_ctr,
                'cvr': avg_cvr,
                'avg_cpc': avg_cpc,
                'avg_position': round(avg_position, 2),
                'revenue': total_revenue,
                'avg_cpa': avg_cpa,
                'roas': roas
            },
            'by_keyword': aggregated_keywords,
            'daily_trends': daily_data,
            'segmented_trends': segmented_trends,
            'duration_ms': 20,  # Deterministic simulations are fast
            'simulated_at': result['simulated_at'],
            'seed': result['seed'],
            'geo': result['geo'],
            'total_keywords': result['total_keywords'],
            'deterministic': True,
            'logic_backed': True,
            'note': 'This simulation uses logic-backed projections with deterministic daily trends'
        }
        try:
            set_cached_result(f"results:{run_id}", response_payload)
        except Exception:
            # Best effort persistence; do not block response
            pass
        
        # Format response for frontend compatibility
        return response_payload
        
    except Exception as e:
        logger.error(f"Cached simulation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/reproducible-simulate", response_model=SimulationResponse)
async def run_reproducible_simulation_endpoint(request: ReproducibleSimulationRequest):
    """
    Run reproducible simulation (always cached)
    
    This endpoint guarantees reproducible results by always using cache
    with extended TTL for consistent outputs.
    """
    try:
        # Convert keywords to dictionary format
        keywords_data = [
            {
                'text': kw.text,
                'bid': kw.bid,
                'quality_score': kw.quality_score,
                'match_type': kw.match_type
            }
            for kw in request.keywords
        ]
        
        # Extract geo from campaign or use default
        geo = getattr(request.campaign, 'geo', 'US')
        
        # Run reproducible simulation
        result = run_reproducible_simulation(
            keywords=keywords_data,
            geo=geo,
            campaign_context=request.campaign_context,
            seed=request.seed
        )
        
        return SimulationResponse(
            results=result['results'],
            cache_hit=result['cache_hit'],
            cache_key=result.get('cache_key'),
            cached_at=result.get('cached_at'),
            simulated_at=result['simulated_at'],
            seed=result['seed'],
            geo=result['geo'],
            total_keywords=result['total_keywords'],
            config=result['config']
        )
        
    except Exception as e:
        logger.error(f"Reproducible simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.get("/results/{run_id}")
async def get_simulation_results(run_id: str):
    """
    Retrieve previously saved simulation results by run_id
    """
    try:
        data = get_cached_result(f"results:{run_id}")
        if not data:
            raise HTTPException(status_code=404, detail="Results not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get results for {run_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get results")

@router.get("/cache/stats")
async def get_cache_statistics():
    """
    Get cache statistics
    
    Returns cache hit rate, memory usage, and other statistics.
    """
    try:
        stats = get_simulation_cache_stats()
        return {
            "status": "success",
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")

@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached simulations
    
    This will remove all cached results and reset statistics.
    """
    try:
        from app.core.deterministic_cache import clear_simulation_cache
        clear_simulation_cache()
        return {
            "status": "success",
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

@router.post("/cache/cleanup")
async def cleanup_cache():
    """
    Cleanup expired cache entries
    
    This will remove expired entries and optimize cache storage.
    """
    try:
        from app.core.deterministic_cache import cleanup_simulation_cache
        cleanup_simulation_cache()
        return {
            "status": "success",
            "message": "Cache cleanup completed"
        }
    except Exception as e:
        logger.error(f"Failed to cleanup cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup cache: {str(e)}")

@router.post("/cache/enable")
async def enable_cache():
    """Enable caching for simulations"""
    try:
        cached_simulation_service.enable_cache()
        return {
            "status": "success",
            "message": "Cache enabled"
        }
    except Exception as e:
        logger.error(f"Failed to enable cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enable cache: {str(e)}")

@router.post("/cache/disable")
async def disable_cache():
    """Disable caching for simulations"""
    try:
        cached_simulation_service.disable_cache()
        return {
            "status": "success",
            "message": "Cache disabled"
        }
    except Exception as e:
        logger.error(f"Failed to disable cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to disable cache: {str(e)}")

@router.get("/cache/test")
async def test_cache_functionality():
    """
    Test cache functionality with sample simulation
    
    This endpoint tests the cache system with a simple simulation.
    """
    try:
        # Sample keywords for testing
        test_keywords = [
            {
                'text': 'test keyword',
                'bid': 5.0,
                'quality_score': 5,
                'match_type': 'phrase'
            }
        ]
        
        # Run simulation twice to test caching
        result1 = run_deterministic_simulation(
            keywords=test_keywords,
            geo='US',
            campaign_context={'test': True},
            seed=12345,
            use_cache=True
        )
        
        result2 = run_deterministic_simulation(
            keywords=test_keywords,
            geo='US',
            campaign_context={'test': True},
            seed=12345,
            use_cache=True
        )
        
        # Check if second result was cached
        cache_working = result2['cache_hit'] and result1['cache_key'] == result2['cache_key']
        
        return {
            "status": "success",
            "cache_working": cache_working,
            "first_run_cache_hit": result1['cache_hit'],
            "second_run_cache_hit": result2['cache_hit'],
            "cache_key_match": result1['cache_key'] == result2['cache_key'],
            "stats": get_simulation_cache_stats()
        }
        
    except Exception as e:
        logger.error(f"Cache test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cache test failed: {str(e)}")
