"""
Post-Click Funnel Logic

This module implements the post-click funnel logic for calculating
clicks, conversions, revenue, and ROAS based on campaign performance.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class FunnelMetrics:
    """Post-click funnel metrics"""
    impressions: int
    clicks: int
    conversions: int
    revenue: float
    cost: float
    ctr: float
    cvr: float
    cpc: float
    cpa: float
    roas: float

def calculate_post_click_funnel(
    impressions: int,
    ctr: float,
    cvr: float,
    avg_cpc: float,
    campaign_objective: str,
    avg_order_value: float = 100.0,
    lp_score: float = 0.7
) -> FunnelMetrics:
    """
    Calculate post-click funnel metrics
    
    Args:
        impressions: Number of impressions
        ctr: Click-through rate
        cvr: Conversion rate
        avg_cpc: Average cost per click
        campaign_objective: Campaign objective (sales, leads, traffic)
        avg_order_value: Average order value (for sales campaigns)
        lp_score: Landing page experience score
        
    Returns:
        FunnelMetrics object with all calculated metrics
    """
    # Calculate clicks
    clicks = int(impressions * ctr)
    
    # Calculate conversions
    conversions = int(clicks * cvr)
    
    # Calculate cost
    cost = clicks * avg_cpc
    
    # Calculate revenue based on campaign objective
    if campaign_objective == "sales":
        revenue = conversions * avg_order_value
    elif campaign_objective == "leads":
        # Lead value estimation (simplified)
        revenue = conversions * (avg_order_value * 0.3)  # Leads worth 30% of sales
    else:  # traffic, brand_awareness
        revenue = 0.0  # No direct revenue for traffic campaigns
    
    # Calculate derived metrics
    actual_ctr = clicks / impressions if impressions > 0 else 0
    actual_cvr = conversions / clicks if clicks > 0 else 0
    cpc = cost / clicks if clicks > 0 else 0
    cpa = cost / conversions if conversions > 0 else 0
    roas = revenue / cost if cost > 0 else 0
    
    return FunnelMetrics(
        impressions=impressions,
        clicks=clicks,
        conversions=conversions,
        revenue=revenue,
        cost=cost,
        ctr=actual_ctr,
        cvr=actual_cvr,
        cpc=cpc,
        cpa=cpa,
        roas=roas
    )

def calculate_daily_funnel(
    daily_auctions: int,
    ctr: float,
    cvr: float,
    avg_cpc: float,
    campaign_objective: str,
    avg_order_value: float = 100.0,
    lp_score: float = 0.7
) -> FunnelMetrics:
    """
    Calculate daily funnel metrics based on auction participation
    
    Args:
        daily_auctions: Number of daily auctions
        ctr: Click-through rate
        cvr: Conversion rate
        avg_cpc: Average cost per click
        campaign_objective: Campaign objective
        avg_order_value: Average order value
        lp_score: Landing page experience score
        
    Returns:
        FunnelMetrics for daily performance
    """
    # Estimate impressions from auctions (simplified)
    # In reality, not all auctions result in impressions
    impressions = int(daily_auctions * 0.8)  # 80% auction participation rate
    
    return calculate_post_click_funnel(
        impressions=impressions,
        ctr=ctr,
        cvr=cvr,
        avg_cpc=avg_cpc,
        campaign_objective=campaign_objective,
        avg_order_value=avg_order_value,
        lp_score=lp_score
    )

def calculate_campaign_totals(
    keyword_results: List[Dict],
    campaign_objective: str,
    avg_order_value: float = 100.0
) -> Dict[str, float]:
    """
    Calculate campaign-level totals from keyword results
    
    Args:
        keyword_results: List of keyword result dictionaries
        campaign_objective: Campaign objective
        avg_order_value: Average order value
        
    Returns:
        Dictionary with campaign totals
    """
    total_impressions = sum(r.get('impressions', 0) for r in keyword_results)
    total_clicks = sum(r.get('clicks', 0) for r in keyword_results)
    total_conversions = sum(r.get('conversions', 0) for r in keyword_results)
    total_cost = sum(r.get('cost', 0) for r in keyword_results)
    
    # Calculate revenue
    if campaign_objective == "sales":
        total_revenue = total_conversions * avg_order_value
    elif campaign_objective == "leads":
        total_revenue = total_conversions * (avg_order_value * 0.3)
    else:
        total_revenue = 0.0
    
    # Calculate derived metrics
    avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
    avg_cvr = total_conversions / total_clicks if total_clicks > 0 else 0
    avg_cpc = total_cost / total_clicks if total_clicks > 0 else 0
    avg_cpa = total_cost / total_conversions if total_conversions > 0 else 0
    roas = total_revenue / total_cost if total_cost > 0 else 0
    
    return {
        'total_impressions': total_impressions,
        'total_clicks': total_clicks,
        'total_conversions': total_conversions,
        'total_revenue': total_revenue,
        'total_cost': total_cost,
        'avg_ctr': avg_ctr,
        'avg_cvr': avg_cvr,
        'avg_cpc': avg_cpc,
        'avg_cpa': avg_cpa,
        'roas': roas
    }

def estimate_avg_order_value(
    industry: str = "general",
    campaign_objective: str = "sales"
) -> float:
    """
    Estimate average order value based on industry and campaign objective
    
    Args:
        industry: Industry type
        campaign_objective: Campaign objective
        
    Returns:
        Estimated average order value
    """
    if campaign_objective != "sales":
        return 0.0
    
    # Industry-based AOV estimates
    industry_aov = {
        "ecommerce": 75.0,
        "retail": 50.0,
        "technology": 200.0,
        "healthcare": 150.0,
        "finance": 300.0,
        "education": 100.0,
        "automotive": 500.0,
        "real_estate": 1000.0,
        "general": 100.0
    }
    
    return industry_aov.get(industry.lower(), 100.0)

def calculate_budget_utilization(
    total_cost: float,
    daily_budget: float
) -> Dict[str, float]:
    """
    Calculate budget utilization metrics
    
    Args:
        total_cost: Total cost incurred
        daily_budget: Daily budget limit
        
    Returns:
        Budget utilization metrics
    """
    utilization_percent = (total_cost / daily_budget) * 100 if daily_budget > 0 else 0
    
    return {
        'utilization_percent': utilization_percent,
        'remaining_budget': max(0, daily_budget - total_cost),
        'over_budget': total_cost > daily_budget,
        'utilization_efficiency': min(100, utilization_percent)
    }
