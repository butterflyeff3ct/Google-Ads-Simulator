"""
Budget Pacing Module

This module handles budget distribution across hours of the day
to simulate realistic ad serving patterns.
"""
import numpy as np
from typing import List, Dict
from app.core.constants import HOURLY_PACING


def distribute_budget_by_hour(daily_budget: float, custom_pacing: List[float] = None) -> List[float]:
    """
    Distribute daily budget across 24 hours
    
    Args:
        daily_budget: Total daily budget
        custom_pacing: Optional custom hourly distribution (must sum to 1.0)
        
    Returns:
        List of 24 hourly budget amounts
    """
    pacing = custom_pacing if custom_pacing else HOURLY_PACING
    
    # Ensure pacing sums to 1.0
    total_pacing = sum(pacing)
    if total_pacing != 1.0:
        pacing = [p / total_pacing for p in pacing]
    
    hourly_budgets = [daily_budget * p for p in pacing]
    
    return hourly_budgets


def apply_pacing_modifier(
    impressions: int,
    hour: int,
    pacing_type: str = "standard"
) -> int:
    """
    Apply pacing modifier to impression delivery
    
    Args:
        impressions: Base impression count
        hour: Hour of day (0-23)
        pacing_type: 'standard', 'accelerated', or 'conservative'
        
    Returns:
        Modified impression count
    """
    if pacing_type == "accelerated":
        # Deliver ads faster - less budget spreading
        modifier = 1.3
    elif pacing_type == "conservative":
        # Deliver ads more evenly - more budget spreading
        modifier = 0.8
    else:  # standard
        modifier = 1.0
    
    return int(impressions * modifier)


def calculate_budget_utilization(
    spent: float,
    budget: float,
    hours_elapsed: int,
    total_hours: int = 24
) -> Dict[str, float]:
    """
    Calculate budget utilization metrics
    
    Args:
        spent: Amount spent so far
        budget: Total budget
        hours_elapsed: Hours elapsed in the period
        total_hours: Total hours in period (usually 24)
        
    Returns:
        Dictionary with utilization metrics
    """
    expected_spend = budget * (hours_elapsed / total_hours)
    utilization_rate = (spent / budget) if budget > 0 else 0
    pace = (spent / expected_spend) if expected_spend > 0 else 0
    
    return {
        "spent": round(float(spent), 2),
        "budget": round(float(budget), 2),
        "remaining": round(float(budget - spent), 2),
        "utilization_rate": round(float(utilization_rate), 4),
        "pace": round(float(pace), 2),  # > 1.0 means spending too fast
        "on_track": bool(0.9 <= pace <= 1.1)  # Within 10% of expected
    }


def get_hourly_budget_recommendation(
    daily_budget: float,
    current_hour: int,
    spent_so_far: float
) -> float:
    """
    Get recommended budget for current hour based on spending so far
    
    Args:
        daily_budget: Total daily budget
        current_hour: Current hour (0-23)
        spent_so_far: Amount spent up to now
        
    Returns:
        Recommended budget for current hour
    """
    hourly_budgets = distribute_budget_by_hour(daily_budget)
    remaining_budget = daily_budget - spent_so_far
    
    # Sum remaining hourly allocations
    remaining_hours_budget = sum(hourly_budgets[current_hour:])
    
    if remaining_hours_budget == 0:
        return 0
    
    # Proportionally adjust remaining budget
    adjustment_factor = remaining_budget / remaining_hours_budget
    recommended = hourly_budgets[current_hour] * adjustment_factor
    
    return max(0, round(recommended, 2))
