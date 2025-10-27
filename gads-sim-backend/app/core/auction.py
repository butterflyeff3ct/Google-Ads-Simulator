"""
Search Ad Auction Engine - Core Logic

This module implements the deterministic ad auction algorithm:
1. Calculate Ad Rank (bid × quality_score)
2. Determine winners based on Ad Rank
3. Calculate CPC using next highest Ad Rank
"""
import numpy as np
from typing import List, Dict, Tuple
from app.core.constants import MIN_AD_RANK, MAX_POSITION


def calculate_ad_rank(bid: float, quality_score: int) -> float:
    """
    Calculate Ad Rank for a single ad
    
    Ad Rank = Bid × Quality Score
    
    Args:
        bid: Maximum CPC bid
        quality_score: Quality Score (1-10)
        
    Returns:
        Ad Rank score
    """
    return bid * quality_score


def run_auction(ads: List[Dict], seed: int = 12345) -> List[Dict]:
    """
    Run a single auction and determine winners
    
    Args:
        ads: List of ad dictionaries with 'bid', 'quality_score', 'keyword'
        seed: Random seed for determinism
        
    Returns:
        List of winning ads with position and CPC
    """
    np.random.seed(seed)
    
    # Calculate Ad Rank for each ad
    for ad in ads:
        ad['ad_rank'] = calculate_ad_rank(ad['bid'], ad['quality_score'])
    
    # Sort by Ad Rank (descending)
    sorted_ads = sorted(ads, key=lambda x: x['ad_rank'], reverse=True)
    
    # Filter out ads below minimum Ad Rank
    eligible_ads = [ad for ad in sorted_ads if ad['ad_rank'] >= MIN_AD_RANK]
    
    # Assign positions (max 10 ads per page)
    winners = []
    for position, ad in enumerate(eligible_ads[:MAX_POSITION], start=1):
        # Calculate CPC using next highest Ad Rank
        if position < len(eligible_ads):
            next_ad_rank = eligible_ads[position]['ad_rank']
            cpc = (next_ad_rank / ad['quality_score']) + 0.01  # Add 1 cent
        else:
            # Last ad pays minimum to maintain position
            cpc = (MIN_AD_RANK / ad['quality_score']) + 0.01
        
        winners.append({
            'keyword': ad['keyword'],
            'position': position,
            'ad_rank': ad['ad_rank'],
            'cpc': round(cpc, 2),
            'quality_score': ad['quality_score'],
            'bid': ad['bid']
        })
    
    return winners


def simulate_multiple_auctions(
    keywords: List[Dict],
    num_auctions: int = 10000,
    seed: int = 12345
) -> List[Dict]:
    """
    Simulate multiple auctions for given keywords
    
    Args:
        keywords: List of keyword configs with bid and quality_score
        num_auctions: Number of auctions to simulate
        seed: Random seed for determinism
        
    Returns:
        List of auction results
    """
    np.random.seed(seed)
    results = []
    
    for auction_id in range(num_auctions):
        # Create ads for this auction (one per keyword)
        ads = [
            {
                'keyword': kw['text'],
                'bid': kw['bid'],
                'quality_score': kw['quality_score']
            }
            for kw in keywords
        ]
        
        # Run auction
        winners = run_auction(ads, seed=seed + auction_id)
        results.extend(winners)
    
    return results
