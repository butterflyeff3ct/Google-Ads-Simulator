"""
Bidding Strategy Implementations

This module handles different bidding strategies:
- Manual CPC
- Target CPA
- Target ROAS
- Maximize Clicks
- Target Impression Share
"""
import numpy as np
from typing import Dict


def manual_cpc(base_bid: float, **kwargs) -> float:
    """
    Manual CPC - Fixed bid amount
    
    Args:
        base_bid: The manual bid set by advertiser
        
    Returns:
        Bid amount
    """
    return base_bid


def target_cpa(
    target_cpa: float,
    historical_cvr: float = 0.03,
    **kwargs
) -> float:
    """
    Target CPA - Automatically set bids to achieve target cost per acquisition
    
    Bid = Target_CPA × Expected_CVR
    
    Args:
        target_cpa: Desired cost per conversion
        historical_cvr: Historical conversion rate
        
    Returns:
        Calculated bid
    """
    if historical_cvr == 0:
        historical_cvr = 0.03  # Default 3% CVR
    
    bid = target_cpa * historical_cvr
    return round(bid, 2)


def target_roas(
    target_roas: float,
    conversion_value: float,
    historical_cvr: float = 0.03,
    **kwargs
) -> float:
    """
    Target ROAS - Bid to achieve target return on ad spend
    
    Bid = (Conversion_Value / Target_ROAS) × Expected_CVR
    
    Args:
        target_roas: Desired return on ad spend (e.g., 4.0 = 400%)
        conversion_value: Average value per conversion
        historical_cvr: Historical conversion rate
        
    Returns:
        Calculated bid
    """
    if target_roas == 0 or historical_cvr == 0:
        return 1.0  # Default bid
    
    bid = (conversion_value / target_roas) * historical_cvr
    return round(bid, 2)


def maximize_clicks(
    daily_budget: float,
    estimated_clicks: int,
    **kwargs
) -> float:
    """
    Maximize Clicks - Set bids to get maximum clicks within budget
    
    Bid = Daily_Budget / Estimated_Total_Clicks × 1.2
    (Factor of 1.2 to be competitive)
    
    Args:
        daily_budget: Total daily budget
        estimated_clicks: Estimated number of clicks available
        
    Returns:
        Calculated bid
    """
    if estimated_clicks == 0:
        estimated_clicks = 100  # Default estimate
    
    bid = (daily_budget / estimated_clicks) * 1.2
    return round(max(0.10, bid), 2)  # Minimum 10 cents


def target_impression_share(
    target_share: float,
    avg_cpc: float,
    competitor_bid_estimate: float = None,
    **kwargs
) -> float:
    """
    Target Impression Share - Bid to achieve target % of impressions
    
    Args:
        target_share: Desired impression share (0.0 to 1.0)
        avg_cpc: Current average CPC
        competitor_bid_estimate: Estimated competitor bids
        
    Returns:
        Calculated bid
    """
    if competitor_bid_estimate is None:
        competitor_bid_estimate = avg_cpc * 1.5
    
    # Bid higher to get more impression share
    if target_share >= 0.9:  # 90%+
        multiplier = 1.8
    elif target_share >= 0.7:  # 70-89%
        multiplier = 1.5
    elif target_share >= 0.5:  # 50-69%
        multiplier = 1.2
    else:  # < 50%
        multiplier = 1.0
    
    bid = competitor_bid_estimate * multiplier
    return round(bid, 2)


# Strategy dispatcher
STRATEGY_FUNCTIONS = {
    "manual_cpc": manual_cpc,
    "target_cpa": target_cpa,
    "target_roas": target_roas,
    "maximize_clicks": maximize_clicks,
    "target_impression_share": target_impression_share
}


def apply_bidding_strategy(
    strategy: str,
    base_bid: float,
    **strategy_params
) -> float:
    """
    Apply the specified bidding strategy
    
    Args:
        strategy: Name of bidding strategy
        base_bid: Base/manual bid amount
        **strategy_params: Strategy-specific parameters
        
    Returns:
        Calculated bid amount
    """
    strategy_func = STRATEGY_FUNCTIONS.get(strategy, manual_cpc)
    
    return strategy_func(base_bid=base_bid, **strategy_params)
