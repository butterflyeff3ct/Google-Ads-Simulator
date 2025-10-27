"""
Enhanced Simulation API with Confidence Ranges and Metrics Breakdown

This module provides enhanced simulation endpoints with confidence ranges,
metrics breakdown, and comprehensive visualization data.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from app.core.cached_simulation import run_deterministic_simulation
from app.core.confidence_ranges import (
    confidence_calculator, calculate_metric_confidence,
    get_match_type_variance_percentages
)
from app.core.metrics_breakdown import create_metrics_breakdown, metrics_breakdown_engine
from app.api.simulate import Keyword, Campaign, SimulationSettings

logger = logging.getLogger(__name__)

router = APIRouter()

class EnhancedSimulationRequest(BaseModel):
    """Request model for enhanced simulation with confidence ranges"""
    campaign: Campaign
    keywords: List[Keyword]
    settings: SimulationSettings
    seed: Optional[int] = 12345
    include_confidence_ranges: bool = True
    include_metrics_breakdown: bool = True
    campaign_context: Optional[Dict[str, Any]] = None

class ConfidenceRangeResponse(BaseModel):
    """Response model for confidence range"""
    lower_bound: float
    upper_bound: float
    variance_percentage: float
    confidence_level: float

class EnhancedSimulationResponse(BaseModel):
    """Enhanced response model with confidence ranges and breakdown"""
    results: List[Dict[str, Any]]
    confidence_ranges: Dict[str, Dict[str, ConfidenceRangeResponse]]
    metrics_breakdown: Dict[str, Any]
    match_type_variance: Dict[str, float]
    cache_hit: bool
    cache_key: Optional[str] = None
    simulated_at: str
    seed: int
    geo: str
    total_keywords: int

@router.post("/enhanced-simulate-with-confidence", response_model=EnhancedSimulationResponse)
async def run_enhanced_simulation_with_confidence(request: EnhancedSimulationRequest):
    """
    Run enhanced simulation with confidence ranges and metrics breakdown
    
    This endpoint provides:
    - Deterministic simulation results
    - Confidence ranges for each metric
    - Comprehensive metrics breakdown
    - Match type variance information
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
        
        # Run cached simulation
        simulation_result = run_deterministic_simulation(
            keywords=keywords_data,
            geo=geo,
            campaign_context=request.campaign_context,
            seed=request.seed,
            use_cache=True
        )
        
        results = simulation_result['results']
        
        # Calculate confidence ranges if requested
        confidence_ranges = {}
        if request.include_confidence_ranges:
            confidence_ranges = calculate_confidence_ranges_for_results(
                results, request.campaign_context
            )
        
        # Calculate metrics breakdown if requested
        metrics_breakdown = {}
        if request.include_metrics_breakdown:
            metrics_breakdown = create_metrics_breakdown(results)
        
        # Get match type variance information
        match_type_variance = get_match_type_variance_percentages()
        
        return EnhancedSimulationResponse(
            results=results,
            confidence_ranges=confidence_ranges,
            metrics_breakdown=metrics_breakdown,
            match_type_variance=match_type_variance,
            cache_hit=simulation_result['cache_hit'],
            cache_key=simulation_result.get('cache_key'),
            simulated_at=simulation_result['simulated_at'],
            seed=simulation_result['seed'],
            geo=simulation_result['geo'],
            total_keywords=simulation_result['total_keywords']
        )
        
    except Exception as e:
        logger.error(f"Enhanced simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

def calculate_confidence_ranges_for_results(
    results: List[Dict[str, Any]], 
    campaign_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Dict[str, ConfidenceRangeResponse]]:
    """
    Calculate confidence ranges for all results
    
    Args:
        results: List of simulation results
        campaign_context: Campaign context
        
    Returns:
        Dictionary of keyword -> metric -> ConfidenceRangeResponse
    """
    confidence_ranges = {}
    
    for result in results:
        keyword = result.get('keyword', 'unknown')
        match_type = result.get('match_type', 'phrase')
        
        keyword_ranges = {}
        
        # Calculate confidence ranges for key metrics
        metrics_to_calculate = [
            'impressions', 'clicks', 'conversions', 'cost', 'revenue',
            'ctr', 'cvr', 'cpc', 'cpa', 'roas'
        ]
        
        for metric in metrics_to_calculate:
            value = result.get(metric, 0)
            if value > 0:  # Only calculate for non-zero values
                lower_bound, upper_bound, variance_percentage = calculate_metric_confidence(
                    value, metric, match_type, campaign_context
                )
                
                keyword_ranges[metric] = ConfidenceRangeResponse(
                    lower_bound=lower_bound,
                    upper_bound=upper_bound,
                    variance_percentage=variance_percentage,
                    confidence_level=0.95
                )
        
        confidence_ranges[keyword] = keyword_ranges
    
    return confidence_ranges

@router.get("/confidence-ranges/variance-percentages")
async def get_variance_percentages():
    """
    Get variance percentages for each match type
    
    Returns:
        Dictionary of match type -> variance percentage
    """
    return get_match_type_variance_percentages()

@router.post("/metrics-breakdown")
async def get_metrics_breakdown(request: EnhancedSimulationRequest):
    """
    Get detailed metrics breakdown for simulation results
    
    Returns:
        Comprehensive metrics breakdown
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
        
        # Run simulation
        simulation_result = run_deterministic_simulation(
            keywords=keywords_data,
            geo=geo,
            campaign_context=request.campaign_context,
            seed=request.seed,
            use_cache=True
        )
        
        results = simulation_result['results']
        
        # Create comprehensive breakdown
        breakdown = create_metrics_breakdown(results)
        
        return {
            "status": "success",
            "breakdown": breakdown,
            "cache_hit": simulation_result['cache_hit']
        }
        
    except Exception as e:
        logger.error(f"Metrics breakdown failed: {e}")
        raise HTTPException(status_code=500, detail=f"Breakdown failed: {str(e)}")

@router.get("/visualization/summary-table")
async def get_summary_table_data():
    """
    Get summary table data for visualization
    
    Returns:
        Sample summary table data for frontend
    """
    # Sample data for demonstration
    sample_data = {
        "exact": {
            "impressions": 12430,
            "ctr": 6.2,
            "cvr": 9.8,
            "cpc": 8.50,
            "cpa": 86.73,
            "roas": 2.35,
            "cost": 4250.00,
            "revenue": 9987.50
        },
        "phrase": {
            "impressions": 21030,
            "ctr": 4.7,
            "cvr": 6.7,
            "cpc": 6.25,
            "cpa": 93.28,
            "roas": 1.87,
            "cost": 6568.75,
            "revenue": 12285.63
        },
        "broad": {
            "impressions": 32120,
            "ctr": 3.3,
            "cvr": 5.1,
            "cpc": 4.80,
            "cpa": 94.12,
            "roas": 1.65,
            "cost": 5139.20,
            "revenue": 8480.16
        }
    }
    
    return {
        "status": "success",
        "summary_table": sample_data,
        "total_impressions": 65580,
        "total_cost": 15957.95,
        "total_revenue": 30753.29,
        "overall_roas": 1.93
    }

@router.get("/visualization/error-ranges")
async def get_error_ranges_sample():
    """
    Get sample error ranges for visualization
    
    Returns:
        Sample error range data for frontend
    """
    from app.core.confidence_ranges import simulate_error_range
    
    # Sample error ranges for different metrics and match types
    error_ranges = {}
    
    metrics = ['impressions', 'clicks', 'conversions', 'cost', 'revenue', 'ctr', 'cvr', 'cpc', 'roas']
    match_types = ['exact', 'phrase', 'broad']
    
    for metric in metrics:
        error_ranges[metric] = {}
        for match_type in match_types:
            error_ranges[metric][match_type] = simulate_error_range(metric, match_type)
    
    return {
        "status": "success",
        "error_ranges": error_ranges,
        "variance_percentages": get_match_type_variance_percentages()
    }
