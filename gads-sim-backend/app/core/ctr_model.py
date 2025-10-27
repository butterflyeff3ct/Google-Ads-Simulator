"""
Deterministic CTR and CVR Model

This module implements deterministic CTR and CVR calculations using
sigmoid functions and campaign objective-based logic.
"""

import math
from typing import Dict, List, Optional, Tuple
from app.core.matching import get_ctr_boost

def simulate_ctr(
    ad_rank: float, 
    position: int, 
    device_type: str = "desktop", 
    extensions: List[str] = None,
    match_type: str = "phrase"
) -> float:
    """
    Simulate CTR using deterministic sigmoid function
    
    Args:
        ad_rank: Ad rank score
        position: Ad position (1-4)
        device_type: mobile, desktop, tablet
        extensions: List of ad extensions
        match_type: exact, phrase, broad
        
    Returns:
        CTR (0.0 to 0.25)
    """
    # Base CTR using sigmoid function
    base_ctr = 0.03 + (1 / (1 + math.exp(-ad_rank)))
    
    # Position boost
    if position == 1:
        base_ctr += 0.05
    elif position == 2:
        base_ctr += 0.03
    elif position == 3:
        base_ctr += 0.01
    
    # Device type boost
    if device_type == "mobile":
        base_ctr += 0.02
    elif device_type == "tablet":
        base_ctr += 0.01
    
    # Extensions boost
    if extensions:
        base_ctr += 0.01 * len(extensions)
    
    # Apply match type CTR boost
    ctr_boost = get_ctr_boost(match_type)
    base_ctr *= (1 + ctr_boost)
    
    # Cap at 25%
    return min(base_ctr, 0.25)

def simulate_cvr(
    campaign_objective: str, 
    lp_score: float,
    ad_rank: float = 5.0,
    position: int = 1
) -> float:
    """
    Simulate CVR based on campaign objective and landing page score
    
    Args:
        campaign_objective: sales, leads, traffic
        lp_score: Landing page experience score (0.1 to 1.0)
        ad_rank: Ad rank score (affects conversion quality)
        position: Ad position (affects conversion intent)
        
    Returns:
        CVR (0.0 to 1.0)
    """
    # Base CVR by campaign objective
    base_cvr = {
        "sales": 0.08,
        "leads": 0.12,
        "traffic": 0.03,
        "website_traffic": 0.03,
        "brand_awareness": 0.02
    }.get(campaign_objective, 0.05)
    
    # Apply landing page score multiplier
    cvr = base_cvr * lp_score
    
    # Ad rank quality boost (higher rank = better conversion quality)
    if ad_rank > 7:
        cvr *= 1.2
    elif ad_rank > 5:
        cvr *= 1.1
    elif ad_rank < 3:
        cvr *= 0.8
    
    # Position intent boost (position 1 = higher intent)
    if position == 1:
        cvr *= 1.3
    elif position == 2:
        cvr *= 1.1
    elif position == 3:
        cvr *= 1.0
    else:
        cvr *= 0.9
    
    return min(cvr, 1.0)

def calculate_ctr(
    keyword: str,
    match_type: str,
    position: int,
    quality_score: int,
    device_type: str = "desktop",
    extensions: List[str] = None
) -> float:
    """
    Calculate CTR using deterministic model
    
    Args:
        keyword: Keyword text
        match_type: exact, phrase, broad
        position: Ad position
        quality_score: Quality Score (1-10)
        device_type: mobile, desktop, tablet
        extensions: List of extensions
        
    Returns:
        CTR percentage
    """
    # Calculate ad rank (simplified)
    ad_rank = quality_score * 1.5  # Simplified ad rank calculation
    
    # Calculate CTR
    ctr = simulate_ctr(
        ad_rank=ad_rank,
        position=position,
        device_type=device_type,
        extensions=extensions or [],
        match_type=match_type
    )
    
    return ctr

def calculate_cvr(
    campaign_objective: str,
    lp_score: float,
    quality_score: int = 5,
    position: int = 1
) -> float:
    """
    Calculate CVR using deterministic model
    
    Args:
        campaign_objective: Campaign objective
        lp_score: Landing page score
        quality_score: Quality Score
        position: Ad position
        
    Returns:
        CVR percentage
    """
    ad_rank = quality_score * 1.5  # Simplified ad rank calculation
    
    cvr = simulate_cvr(
        campaign_objective=campaign_objective,
        lp_score=lp_score,
        ad_rank=ad_rank,
        position=position
    )
    
    return cvr

def calculate_quality_score_enhanced(
    keyword: str,
    match_type: str,
    campaign_context: Optional[Dict] = None
) -> int:
    """
    Calculate enhanced Quality Score (placeholder for integration)
    
    Args:
        keyword: Keyword text
        match_type: Match type
        campaign_context: Campaign context
        
    Returns:
        Quality Score (1-10)
    """
    # This would integrate with the Quality Score engine
    # For now, return a base score
    base_qs = 5
    
    # Match type impact
    if match_type == "exact":
        base_qs += 1
    elif match_type == "broad":
        base_qs -= 1
    
    return max(1, min(10, base_qs))

# Legacy functions for backward compatibility
def calculate_impressions(
    hourly_budget: float,
    avg_cpc: float,
    avg_ctr: float,
    hour: int
) -> int:
    """
    Calculate expected impressions for a given hour
    
    Args:
        hourly_budget: Budget allocated for this hour
        avg_cpc: Average Cost-Per-Click
        avg_ctr: Average Click-Through Rate
        hour: Hour of day (0-23)
        
    Returns:
        Number of impressions
    """
    if avg_ctr == 0 or avg_cpc == 0:
        return 0
    
    # Expected clicks based on budget
    expected_clicks = hourly_budget / avg_cpc
    
    # Impressions needed to get those clicks
    impressions = int(expected_clicks / avg_ctr)
    
    return max(0, impressions)