"""
Confidence Range Calculation

This module implements confidence range calculations instead of random variance
for more realistic and deterministic error bounds.
"""

import math
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from app.core.matching import get_match_type_modifiers

@dataclass
class ConfidenceRange:
    """Confidence range for a metric"""
    lower_bound: float
    upper_bound: float
    confidence_level: float  # e.g., 0.95 for 95% confidence
    variance_percentage: float  # e.g., 0.05 for ±5%

@dataclass
class ErrorRange:
    """Error range for visualization"""
    min_value: float
    max_value: float
    variance_percent: float
    match_type: str

class ConfidenceCalculator:
    """
    Calculate confidence ranges based on match type and campaign factors
    
    Features:
    - Match type-based variance
    - Campaign context consideration
    - Statistical confidence intervals
    - Deterministic error bounds
    """
    
    def __init__(self):
        # Match type variance percentages
        self.match_type_variance = {
            'exact': 0.01,    # ±1% for exact match
            'phrase': 0.03,   # ±3% for phrase match
            'broad': 0.05     # ±5% for broad match
        }
        
        # Base confidence factors
        self.base_confidence_factors = {
            'volume': 0.02,      # Volume estimation variance
            'ctr': 0.03,        # CTR prediction variance
            'cvr': 0.04,        # CVR prediction variance
            'cpc': 0.05,        # CPC estimation variance
            'cost': 0.06,       # Cost calculation variance
            'revenue': 0.07,    # Revenue projection variance
            'roas': 0.08        # ROAS calculation variance
        }
    
    def calculate_confidence_range(
        self,
        value: float,
        metric_type: str,
        match_type: str,
        confidence_level: float = 0.95,
        campaign_context: Optional[Dict[str, Any]] = None
    ) -> ConfidenceRange:
        """
        Calculate confidence range for a metric value
        
        Args:
            value: The metric value
            metric_type: Type of metric (volume, ctr, cvr, etc.)
            match_type: Match type (exact, phrase, broad)
            confidence_level: Confidence level (0.95 = 95%)
            campaign_context: Campaign context for additional factors
            
        Returns:
            ConfidenceRange object
        """
        # Base variance from metric type
        base_variance = self.base_confidence_factors.get(metric_type, 0.05)
        
        # Match type variance
        match_variance = self.match_type_variance.get(match_type, 0.03)
        
        # Campaign context adjustments
        context_factor = self._calculate_context_factor(campaign_context)
        
        # Combined variance (use match type variance as primary, add context factor)
        total_variance = match_variance + context_factor
        
        # Calculate bounds
        variance_amount = value * total_variance
        lower_bound = max(0, value - variance_amount)
        upper_bound = value + variance_amount
        
        return ConfidenceRange(
            lower_bound=lower_bound,
            upper_bound=upper_bound,
            confidence_level=confidence_level,
            variance_percentage=total_variance
        )
    
    def _calculate_context_factor(self, campaign_context: Optional[Dict[str, Any]]) -> float:
        """Calculate additional variance factor from campaign context"""
        if not campaign_context:
            return 0.0
        
        factor = 0.0
        
        # Landing page quality affects variance
        lp_score = campaign_context.get('lp_score', 0.7)
        if lp_score < 0.5:
            factor += 0.02  # Higher variance for poor LP
        elif lp_score > 0.9:
            factor -= 0.01  # Lower variance for excellent LP
        
        # Campaign goal affects variance
        goal = campaign_context.get('goal', 'sales')
        if goal == 'brand_awareness':
            factor += 0.01  # Higher variance for awareness campaigns
        elif goal == 'sales':
            factor -= 0.005  # Lower variance for sales campaigns
        
        # Geographic targeting affects variance
        geo = campaign_context.get('geo', 'US')
        if geo != 'US':
            factor += 0.01  # Higher variance for non-US targeting
        
        return factor
    
    def calculate_error_range(
        self,
        value: float,
        metric_type: str,
        match_type: str,
        campaign_context: Optional[Dict[str, Any]] = None
    ) -> ErrorRange:
        """
        Calculate error range for visualization
        
        Args:
            value: The metric value
            metric_type: Type of metric
            match_type: Match type
            campaign_context: Campaign context
            
        Returns:
            ErrorRange object
        """
        confidence_range = self.calculate_confidence_range(
            value, metric_type, match_type, campaign_context=campaign_context
        )
        
        return ErrorRange(
            min_value=confidence_range.lower_bound,
            max_value=confidence_range.upper_bound,
            variance_percent=confidence_range.variance_percentage,
            match_type=match_type
        )
    
    def calculate_batch_confidence_ranges(
        self,
        metrics: Dict[str, float],
        match_type: str,
        campaign_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, ConfidenceRange]:
        """
        Calculate confidence ranges for multiple metrics
        
        Args:
            metrics: Dictionary of metric_name -> value
            match_type: Match type
            campaign_context: Campaign context
            
        Returns:
            Dictionary of metric_name -> ConfidenceRange
        """
        ranges = {}
        
        for metric_name, value in metrics.items():
            ranges[metric_name] = self.calculate_confidence_range(
                value, metric_name, match_type, campaign_context=campaign_context
            )
        
        return ranges

def simulate_error_range(metric: str, match_type: str = 'phrase') -> Dict[str, float]:
    """
    Simulate error range for visualization (React frontend helper)
    
    Args:
        metric: Metric name
        match_type: Match type
        
    Returns:
        Dictionary with min/max values for error bars
    """
    calculator = ConfidenceCalculator()
    
    # Default values for demonstration
    default_values = {
        'impressions': 10000,
        'clicks': 500,
        'conversions': 25,
        'cost': 2500,
        'revenue': 5000,
        'ctr': 0.05,
        'cvr': 0.05,
        'cpc': 5.0,
        'cpa': 100.0,
        'roas': 2.0
    }
    
    value = default_values.get(metric, 1000)
    error_range = calculator.calculate_error_range(value, metric, match_type)
    
    return {
        'min': error_range.min_value,
        'max': error_range.max_value,
        'variance_percent': error_range.variance_percent
    }

def get_match_type_variance_percentages() -> Dict[str, float]:
    """Get variance percentages for each match type"""
    calculator = ConfidenceCalculator()
    return calculator.match_type_variance.copy()

def calculate_metric_confidence(
    value: float,
    metric_type: str,
    match_type: str,
    campaign_context: Optional[Dict[str, Any]] = None
) -> Tuple[float, float, float]:
    """
    Calculate confidence bounds for a single metric
    
    Args:
        value: Metric value
        metric_type: Type of metric
        match_type: Match type
        campaign_context: Campaign context
        
    Returns:
        Tuple of (lower_bound, upper_bound, variance_percentage)
    """
    calculator = ConfidenceCalculator()
    confidence_range = calculator.calculate_confidence_range(
        value, metric_type, match_type, campaign_context=campaign_context
    )
    
    return (
        confidence_range.lower_bound,
        confidence_range.upper_bound,
        confidence_range.variance_percentage
    )

# Global instance
confidence_calculator = ConfidenceCalculator()
