"""
Metrics Breakdown System

This module provides comprehensive metrics breakdown by keyword, ad group,
device, and match type for detailed analysis and visualization.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict
import pandas as pd
import numpy as np

@dataclass
class MetricBreakdown:
    """Breakdown of metrics by dimension"""
    dimension: str  # e.g., 'match_type', 'device', 'keyword'
    values: Dict[str, Dict[str, float]]  # e.g., {'exact': {'impressions': 1000, 'ctr': 0.05}}
    totals: Dict[str, float]  # Overall totals
    percentages: Dict[str, Dict[str, float]]  # Percentage breakdowns

@dataclass
class KeywordMetrics:
    """Metrics for a single keyword"""
    keyword: str
    match_type: str
    impressions: int
    clicks: int
    conversions: int
    cost: float
    revenue: float
    ctr: float
    cvr: float
    cpc: float
    cpa: float
    roas: float
    position: float
    quality_score: int
    ad_rank: float

class MetricsBreakdownEngine:
    """
    Engine for breaking down simulation results by various dimensions
    
    Features:
    - GroupBy functionality
    - Multi-dimensional analysis
    - Percentage calculations
    - Summary statistics
    - Export-ready data structures
    """
    
    def __init__(self):
        self.metric_names = [
            'impressions', 'clicks', 'conversions', 'cost', 'revenue',
            'ctr', 'cvr', 'cpc', 'cpa', 'roas', 'position', 'quality_score'
        ]
    
    def breakdown_by_match_type(self, results: List[Dict[str, Any]]) -> MetricBreakdown:
        """
        Break down metrics by match type
        
        Args:
            results: List of simulation results
            
        Returns:
            MetricBreakdown by match type
        """
        breakdown = defaultdict(lambda: defaultdict(float))
        totals = defaultdict(float)
        
        for result in results:
            match_type = result.get('match_type', 'unknown')
            
            for metric in self.metric_names:
                value = result.get(metric, 0)
                breakdown[match_type][metric] += value
                totals[metric] += value
        
        # Calculate percentages
        percentages = {}
        for match_type, metrics in breakdown.items():
            percentages[match_type] = {}
            for metric, value in metrics.items():
                if totals[metric] > 0:
                    percentages[match_type][metric] = (value / totals[metric]) * 100
                else:
                    percentages[match_type][metric] = 0
        
        return MetricBreakdown(
            dimension='match_type',
            values=dict(breakdown),
            totals=dict(totals),
            percentages=percentages
        )
    
    def breakdown_by_keyword(self, results: List[Dict[str, Any]]) -> MetricBreakdown:
        """
        Break down metrics by keyword
        
        Args:
            results: List of simulation results
            
        Returns:
            MetricBreakdown by keyword
        """
        breakdown = defaultdict(lambda: defaultdict(float))
        totals = defaultdict(float)
        
        for result in results:
            keyword = result.get('keyword', 'unknown')
            
            for metric in self.metric_names:
                value = result.get(metric, 0)
                breakdown[keyword][metric] += value
                totals[metric] += value
        
        # Calculate percentages
        percentages = {}
        for keyword, metrics in breakdown.items():
            percentages[keyword] = {}
            for metric, value in metrics.items():
                if totals[metric] > 0:
                    percentages[keyword][metric] = (value / totals[metric]) * 100
                else:
                    percentages[keyword][metric] = 0
        
        return MetricBreakdown(
            dimension='keyword',
            values=dict(breakdown),
            totals=dict(totals),
            percentages=percentages
        )
    
    def breakdown_by_device(self, results: List[Dict[str, Any]]) -> MetricBreakdown:
        """
        Break down metrics by device type
        
        Args:
            results: List of simulation results
            
        Returns:
            MetricBreakdown by device
        """
        breakdown = defaultdict(lambda: defaultdict(float))
        totals = defaultdict(float)
        
        for result in results:
            device = result.get('device_type', 'desktop')
            
            for metric in self.metric_names:
                value = result.get(metric, 0)
                breakdown[device][metric] += value
                totals[metric] += value
        
        # Calculate percentages
        percentages = {}
        for device, metrics in breakdown.items():
            percentages[device] = {}
            for metric, value in metrics.items():
                if totals[metric] > 0:
                    percentages[device][metric] = (value / totals[metric]) * 100
                else:
                    percentages[device][metric] = 0
        
        return MetricBreakdown(
            dimension='device',
            values=dict(breakdown),
            totals=dict(totals),
            percentages=percentages
        )
    
    def breakdown_by_position(self, results: List[Dict[str, Any]]) -> MetricBreakdown:
        """
        Break down metrics by ad position
        
        Args:
            results: List of simulation results
            
        Returns:
            MetricBreakdown by position
        """
        breakdown = defaultdict(lambda: defaultdict(float))
        totals = defaultdict(float)
        
        for result in results:
            position = f"position_{int(result.get('position', 1))}"
            
            for metric in self.metric_names:
                value = result.get(metric, 0)
                breakdown[position][metric] += value
                totals[metric] += value
        
        # Calculate percentages
        percentages = {}
        for position, metrics in breakdown.items():
            percentages[position] = {}
            for metric, value in metrics.items():
                if totals[metric] > 0:
                    percentages[position][metric] = (value / totals[metric]) * 100
                else:
                    percentages[position][metric] = 0
        
        return MetricBreakdown(
            dimension='position',
            values=dict(breakdown),
            totals=dict(totals),
            percentages=percentages
        )
    
    def create_comprehensive_breakdown(self, results: List[Dict[str, Any]]) -> Dict[str, MetricBreakdown]:
        """
        Create comprehensive breakdown by all dimensions
        
        Args:
            results: List of simulation results
            
        Returns:
            Dictionary of dimension -> MetricBreakdown
        """
        return {
            'match_type': self.breakdown_by_match_type(results),
            'keyword': self.breakdown_by_keyword(results),
            'device': self.breakdown_by_device(results),
            'position': self.breakdown_by_position(results)
        }
    
    def create_summary_table(self, results: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """
        Create summary table for visualization
        
        Args:
            results: List of simulation results
            
        Returns:
            Summary table data
        """
        match_type_breakdown = self.breakdown_by_match_type(results)
        
        # Create table format
        table_data = {}
        
        for match_type, metrics in match_type_breakdown.values.items():
            table_data[match_type] = {
                'impressions': int(metrics.get('impressions', 0)),
                'ctr': round(metrics.get('ctr', 0) * 100, 1),  # Convert to percentage
                'cvr': round(metrics.get('cvr', 0) * 100, 1),  # Convert to percentage
                'cpc': round(metrics.get('cpc', 0), 2),
                'cpa': round(metrics.get('cpa', 0), 2),
                'roas': round(metrics.get('roas', 0), 2),
                'cost': round(metrics.get('cost', 0), 2),
                'revenue': round(metrics.get('revenue', 0), 2)
            }
        
        return table_data
    
    def calculate_top_performers(self, results: List[Dict[str, Any]], metric: str = 'roas', limit: int = 10) -> List[Dict[str, Any]]:
        """
        Calculate top performing keywords by metric
        
        Args:
            results: List of simulation results
            metric: Metric to rank by
            limit: Number of top performers to return
            
        Returns:
            List of top performing keywords
        """
        # Sort by metric (descending)
        sorted_results = sorted(results, key=lambda x: x.get(metric, 0), reverse=True)
        
        # Return top performers with additional metrics
        top_performers = []
        for i, result in enumerate(sorted_results[:limit]):
            performer = {
                'rank': i + 1,
                'keyword': result.get('keyword', 'Unknown'),
                'match_type': result.get('match_type', 'Unknown'),
                'metric_value': result.get(metric, 0),
                'impressions': result.get('impressions', 0),
                'clicks': result.get('clicks', 0),
                'conversions': result.get('conversions', 0),
                'cost': result.get('cost', 0),
                'revenue': result.get('revenue', 0),
                'roas': result.get('roas', 0)
            }
            top_performers.append(performer)
        
        return top_performers
    
    def calculate_performance_distribution(self, results: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """
        Calculate performance distribution statistics
        
        Args:
            results: List of simulation results
            
        Returns:
            Distribution statistics for each metric
        """
        distributions = {}
        
        for metric in self.metric_names:
            values = [result.get(metric, 0) for result in results if result.get(metric, 0) > 0]
            
            if values:
                distributions[metric] = {
                    'mean': np.mean(values),
                    'median': np.median(values),
                    'std': np.std(values),
                    'min': np.min(values),
                    'max': np.max(values),
                    'q25': np.percentile(values, 25),
                    'q75': np.percentile(values, 75),
                    'count': len(values)
                }
            else:
                distributions[metric] = {
                    'mean': 0, 'median': 0, 'std': 0, 'min': 0, 'max': 0,
                    'q25': 0, 'q75': 0, 'count': 0
                }
        
        return distributions

# Global instance
metrics_breakdown_engine = MetricsBreakdownEngine()

def create_metrics_breakdown(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Create comprehensive metrics breakdown for frontend visualization
    
    Args:
        results: List of simulation results
        
    Returns:
        Comprehensive breakdown data
    """
    engine = MetricsBreakdownEngine()
    
    # Create all breakdowns
    breakdowns = engine.create_comprehensive_breakdown(results)
    
    # Create summary table
    summary_table = engine.create_summary_table(results)
    
    # Calculate top performers
    top_performers = engine.calculate_top_performers(results)
    
    # Calculate distributions
    distributions = engine.calculate_performance_distribution(results)
    
    return {
        'breakdowns': {
            dimension: {
                'values': breakdown.values,
                'totals': breakdown.totals,
                'percentages': breakdown.percentages
            }
            for dimension, breakdown in breakdowns.items()
        },
        'summary_table': summary_table,
        'top_performers': top_performers,
        'distributions': distributions,
        'total_keywords': len(results),
        'total_impressions': sum(r.get('impressions', 0) for r in results),
        'total_clicks': sum(r.get('clicks', 0) for r in results),
        'total_conversions': sum(r.get('conversions', 0) for r in results),
        'total_cost': sum(r.get('cost', 0) for r in results),
        'total_revenue': sum(r.get('revenue', 0) for r in results)
    }
