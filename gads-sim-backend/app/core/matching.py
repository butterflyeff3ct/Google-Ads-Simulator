"""
Match Type Logic Module

This module implements the match type logic table with volume modifiers,
CPC impact, and CTR boost as specified in Phase 3.
"""

from typing import Dict, Tuple
from dataclasses import dataclass

@dataclass
class MatchTypeModifiers:
    """Match type modifiers for volume, CPC, and CTR"""
    volume_modifier: float
    cpc_impact: float  # Percentage change
    ctr_boost: float   # Percentage change

# Match Type Logic Table
MATCH_TYPE_LOGIC = {
    'exact': MatchTypeModifiers(
        volume_modifier=0.6,  # 60% of volume
        cpc_impact=0.10,      # +10% CPC
        ctr_boost=0.15        # +15% CTR
    ),
    'phrase': MatchTypeModifiers(
        volume_modifier=0.8,  # 80% of volume
        cpc_impact=0.0,       # Neutral CPC
        ctr_boost=0.05        # +5% CTR
    ),
    'broad': MatchTypeModifiers(
        volume_modifier=1.2,  # 120% of volume
        cpc_impact=-0.10,     # -10% CPC
        ctr_boost=-0.05       # -5% CTR
    )
}

def get_match_type_modifiers(match_type: str) -> MatchTypeModifiers:
    """
    Get match type modifiers for volume, CPC, and CTR
    
    Args:
        match_type: exact, phrase, or broad
        
    Returns:
        MatchTypeModifiers object with volume_modifier, cpc_impact, ctr_boost
    """
    return MATCH_TYPE_LOGIC.get(match_type.lower(), MATCH_TYPE_LOGIC['phrase'])

def apply_volume_modifier(base_volume: int, match_type: str) -> int:
    """
    Apply volume modifier based on match type
    
    Args:
        base_volume: Base search volume
        match_type: exact, phrase, or broad
        
    Returns:
        Modified volume
    """
    modifiers = get_match_type_modifiers(match_type)
    return int(base_volume * modifiers.volume_modifier)

def apply_cpc_modifier(base_cpc: float, match_type: str) -> float:
    """
    Apply CPC modifier based on match type
    
    Args:
        base_cpc: Base CPC
        match_type: exact, phrase, or broad
        
    Returns:
        Modified CPC
    """
    modifiers = get_match_type_modifiers(match_type)
    return base_cpc * (1 + modifiers.cpc_impact)

def apply_ctr_modifier(base_ctr: float, match_type: str) -> float:
    """
    Apply CTR modifier based on match type
    
    Args:
        base_ctr: Base CTR
        match_type: exact, phrase, or broad
        
    Returns:
        Modified CTR
    """
    modifiers = get_match_type_modifiers(match_type)
    return base_ctr * (1 + modifiers.ctr_boost)

def get_match_type_summary() -> Dict[str, Dict[str, float]]:
    """
    Get summary of all match type modifiers
    
    Returns:
        Dictionary with match type summaries
    """
    summary = {}
    for match_type, modifiers in MATCH_TYPE_LOGIC.items():
        summary[match_type] = {
            'volume_modifier': modifiers.volume_modifier,
            'cpc_impact': modifiers.cpc_impact,
            'ctr_boost': modifiers.ctr_boost
        }
    return summary

# Convenience functions
def get_volume_modifier(match_type: str) -> float:
    """Get volume modifier for match type"""
    return get_match_type_modifiers(match_type).volume_modifier

def get_cpc_impact(match_type: str) -> float:
    """Get CPC impact for match type"""
    return get_match_type_modifiers(match_type).cpc_impact

def get_ctr_boost(match_type: str) -> float:
    """Get CTR boost for match type"""
    return get_match_type_modifiers(match_type).ctr_boost
