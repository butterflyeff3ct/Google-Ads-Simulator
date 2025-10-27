"""
Enhanced Search Ad Auction Engine - Volume-Based Logic

This module implements deterministic ad auction simulation using:
1. Volume-based auction estimation (replaces random auction count)
2. Match type impact on auction participation
3. Geographic modifiers for location targeting
4. Quality Score calculation from campaign context
5. Deterministic CTR/CVR based on position and relevance
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from app.core.constants import MIN_AD_RANK, MAX_POSITION
from app.core.volume_estimation import volume_engine, AuctionEstimate, VolumeData
from app.core.quality_score_engine import QualityScoreEngine, AdData, KeywordData, calculate_quality_score


def calculate_enhanced_quality_score(
    keyword: str,
    match_type: str,
    campaign_context: Optional[Dict] = None,
    ad_relevance_score: float = 0.7,
    landing_page_score: float = 0.7
) -> int:
    """
    Calculate realistic Quality Score using the Quality Score Engine
    
    Args:
        keyword: The keyword being scored
        match_type: exact, phrase, or broad
        campaign_context: Campaign configuration context
        ad_relevance_score: Relevance score (0.0 to 1.0) - deprecated, using engine
        landing_page_score: Landing page experience score (0.0 to 1.0) - deprecated, using engine
        
    Returns:
        Quality Score (1-10)
    """
    try:
        # Create AdData object from campaign context
        if campaign_context:
            ad = AdData(
                headlines=[campaign_context.get('ad_headline', 'Generic Ad')],
                descriptions=[campaign_context.get('ad_description', 'Generic description')],
                display_url=campaign_context.get('display_url', 'example.com'),
                final_url=campaign_context.get('final_url', 'https://example.com'),
                extensions=campaign_context.get('extensions', []),
                device_targeting=campaign_context.get('device_targeting', 'all')
            )
        else:
            # Create default ad data
            ad = AdData(
                headlines=['Generic Ad'],
                descriptions=['Generic description'],
                display_url='example.com',
                final_url='https://example.com',
                extensions=[],
                device_targeting='all'
            )
        
        # Create KeywordData object
        keyword_obj = KeywordData(
            text=keyword,
            match_type=match_type,
            intent=campaign_context.get('keyword_intent', 'informational') if campaign_context else 'informational',
            competition=campaign_context.get('competition_level', 'medium') if campaign_context else 'medium'
        )
        
        # Calculate Quality Score using the engine
        qs_components = calculate_quality_score(ad, keyword_obj)
        
        return int(qs_components.final_score)
        
    except Exception as e:
        print(f"Error calculating Quality Score with engine: {e}")
        # Fallback to simple calculation
        return calculate_simple_quality_score(keyword, match_type, campaign_context, ad_relevance_score, landing_page_score)

def calculate_simple_quality_score(
    keyword: str,
    match_type: str,
    campaign_context: Optional[Dict] = None,
    ad_relevance_score: float = 0.7,
    landing_page_score: float = 0.7
) -> int:
    """
    Simple Quality Score calculation as fallback
    """
    # Base QS from relevance
    base_qs = 5.0  # Start with average QS
    
    # Ad relevance modifier
    relevance_modifier = (ad_relevance_score - 0.5) * 4  # -2 to +2 range
    
    # Expected CTR modifier based on match type
    match_type_modifiers = {
        'exact': 1.2,    # Exact match typically has higher CTR
        'phrase': 1.0,   # Phrase match baseline
        'broad': 0.8     # Broad match typically has lower CTR
    }
    ctr_modifier = match_type_modifiers.get(match_type, 1.0)
    
    # Landing page experience modifier
    lp_modifier = (landing_page_score - 0.5) * 2  # -1 to +1 range
    
    # Campaign goal alignment modifier
    goal_modifier = 1.0
    if campaign_context:
        goal = campaign_context.get('goal', 'sales')
        reach_methods = campaign_context.get('reach_methods', [])
        
        # Higher QS for campaigns with clear conversion goals
        if goal in ['sales', 'leads'] and 'Your business\'s website' in reach_methods:
            goal_modifier = 1.1
        elif goal == 'website_traffic':
            goal_modifier = 1.05
    
    # Calculate final QS
    final_qs = base_qs + relevance_modifier + (ctr_modifier - 1.0) + lp_modifier
    final_qs *= goal_modifier
    
    # Ensure QS is within 1-10 range
    final_qs = max(1, min(10, final_qs))
    
    return int(round(final_qs))


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
            'match_type': ad.get('match_type', 'phrase'),
            'position': position,
            'ad_rank': ad['ad_rank'],
            'cpc': round(cpc, 2),
            'quality_score': ad['quality_score'],
            'bid': ad['bid']
        })
    
    return winners


def simulate_volume_based_auctions(
    keywords: List[Dict],
    geo: str = 'US',
    campaign_context: Optional[Dict] = None,
    seed: int = 12345
) -> List[Dict]:
    """
    Simulate auctions based on estimated search volume instead of random count
    
    Args:
        keywords: List of keyword configs with bid, quality_score, match_type
        geo: Geographic targeting (US, CA, UK, etc.)
        campaign_context: Campaign configuration context
        seed: Random seed for determinism
        
    Returns:
        List of auction results with volume-based distribution
    """
    np.random.seed(seed)
    results = []
    
    # Calculate total daily auctions across all keywords
    total_daily_auctions = 0
    keyword_auction_data = {}
    
    for kw in keywords:
        # Estimate daily auctions for this keyword
        auction_estimate = volume_engine.estimate_daily_auctions(
            keyword=kw['text'],
            match_type=kw.get('match_type', 'phrase'),
            geo=geo
        )
        
        keyword_auction_data[kw['text']] = auction_estimate
        total_daily_auctions += auction_estimate.daily_auctions
    
    # Distribute auctions across keywords based on their volume
    for kw in keywords:
        auction_estimate = keyword_auction_data[kw['text']]
        keyword_auctions = auction_estimate.daily_auctions
        
        # Create ads for this keyword's auctions
        for auction_id in range(keyword_auctions):
            # Create ads for this auction (one per keyword, but only this keyword participates)
            ads = [{
                'keyword': kw['text'],
                'match_type': kw.get('match_type', 'phrase'),
                'bid': kw['bid'],
                'quality_score': kw['quality_score']
            }]
            
            # Add competitor ads based on competition level
            competitors = _generate_competitor_ads(
                keyword=kw['text'],
                match_type=kw.get('match_type', 'phrase'),
                geo=geo,
                seed=seed + auction_id
            )
            ads.extend(competitors)
            
            # Run auction
            winners = run_auction(ads, seed=seed + auction_id)
            
            # Only include results for our keyword
            our_results = [w for w in winners if w['keyword'] == kw['text']]
            results.extend(our_results)
    
    return results


def _generate_competitor_ads(
    keyword: str,
    match_type: str,
    geo: str,
    seed: int
) -> List[Dict]:
    """
    Generate competitor ads for auction simulation
    
    Args:
        keyword: The keyword being auctioned
        match_type: Match type of the keyword
        geo: Geographic targeting
        seed: Random seed
        
    Returns:
        List of competitor ad dictionaries
    """
    np.random.seed(seed)
    competitors = []
    
    # Get competition level for this keyword
    competition_level = volume_engine.get_competition_level(keyword)
    
    # Determine number of competitors based on competition level
    competitor_counts = {
        'High': (3, 8),    # 3-8 competitors for high competition
        'Medium': (2, 5),  # 2-5 competitors for medium competition
        'Low': (1, 3)      # 1-3 competitors for low competition
    }
    
    min_competitors, max_competitors = competitor_counts.get(competition_level, (2, 5))
    num_competitors = np.random.randint(min_competitors, max_competitors + 1)
    
    # Get estimated CPC range for this keyword
    low_cpc, avg_cpc, high_cpc = volume_engine.get_estimated_cpc(keyword, match_type)
    
    for i in range(num_competitors):
        # Generate competitor bid (typically 70-130% of average CPC)
        bid_range = (avg_cpc * 0.7, avg_cpc * 1.3)
        competitor_bid = np.random.uniform(bid_range[0], bid_range[1])
        
        # Generate competitor quality score (typically 5-9)
        competitor_qs = np.random.randint(5, 10)
        
        competitors.append({
            'keyword': f'competitor_{i}',
            'match_type': match_type,
            'bid': round(competitor_bid, 2),
            'quality_score': competitor_qs
        })
    
    return competitors


def calculate_enhanced_ctr(
    position: int,
    quality_score: int,
    match_type: str,
    keyword: str,
    campaign_context: Optional[Dict] = None,
    seed: int = 12345
) -> float:
    """
    Calculate CTR based on position, quality score, match type, and campaign context
    
    Args:
        position: Ad position (1-10)
        quality_score: Quality Score (1-10)
        match_type: exact, phrase, or broad
        keyword: The keyword
        campaign_context: Campaign configuration context
        seed: Random seed
        
    Returns:
        CTR as decimal (e.g., 0.05 = 5%)
    """
    np.random.seed(seed)
    
    # Base CTR by position (from Google Ads data)
    base_ctr_by_position = {
        1: 0.08,   # Position 1: 8% CTR
        2: 0.05,   # Position 2: 5% CTR
        3: 0.03,   # Position 3: 3% CTR
        4: 0.02,   # Position 4: 2% CTR
        5: 0.015,  # Position 5: 1.5% CTR
        6: 0.01,   # Position 6: 1% CTR
        7: 0.008,  # Position 7: 0.8% CTR
        8: 0.006,  # Position 8: 0.6% CTR
        9: 0.004,  # Position 9: 0.4% CTR
        10: 0.003  # Position 10: 0.3% CTR
    }
    
    base_ctr = base_ctr_by_position.get(position, 0.001)
    
    # Quality Score modifier (7 is baseline = 1.0)
    qs_modifier = 0.7 + (quality_score / 10) * 0.6  # Range: 0.7 to 1.3
    
    # Match type modifier
    match_type_modifiers = {
        'exact': 1.2,    # Exact match has higher CTR
        'phrase': 1.0,   # Phrase match baseline
        'broad': 0.8     # Broad match has lower CTR
    }
    match_modifier = match_type_modifiers.get(match_type, 1.0)
    
    # Campaign context modifier
    context_modifier = 1.0
    if campaign_context:
        goal = campaign_context.get('goal', 'sales')
        reach_methods = campaign_context.get('reach_methods', [])
        
        # Higher CTR for campaigns with clear conversion goals
        if goal in ['sales', 'leads'] and 'Your business\'s website' in reach_methods:
            context_modifier = 1.1
        elif goal == 'website_traffic':
            context_modifier = 1.05
    
    # Calculate final CTR
    ctr = base_ctr * qs_modifier * match_modifier * context_modifier
    
    # Add small random variation (±5%) for realism
    random_factor = np.random.uniform(0.95, 1.05)
    ctr *= random_factor
    
    return round(ctr, 4)


def calculate_enhanced_cvr(
    quality_score: int,
    campaign_context: Optional[Dict] = None,
    base_cvr: float = 0.03,
    seed: int = 12345
) -> float:
    """
    Calculate CVR based on quality score and campaign context
    
    Args:
        quality_score: Quality Score (1-10)
        campaign_context: Campaign configuration context
        base_cvr: Base conversion rate (default 3%)
        seed: Random seed
        
    Returns:
        CVR as decimal (e.g., 0.03 = 3%)
    """
    np.random.seed(seed)
    
    # Quality Score modifier (7 is baseline = 1.0)
    qs_modifier = 0.7 + (quality_score / 10) * 0.6  # Range: 0.7 to 1.3
    
    # Campaign goal modifier
    goal_modifier = 1.0
    if campaign_context:
        goal = campaign_context.get('goal', 'sales')
        
        # Different CVR expectations by goal
        goal_cvr_modifiers = {
            'sales': 1.2,      # Sales campaigns typically have higher CVR
            'leads': 1.1,      # Lead campaigns have good CVR
            'website_traffic': 0.8,  # Traffic campaigns have lower CVR
            'app_promotion': 1.0,
            'product_brand_consideration': 0.9,
            'local_store_visits': 1.1,
            'no_goal': 1.0
        }
        goal_modifier = goal_cvr_modifiers.get(goal, 1.0)
    
    # Calculate final CVR
    cvr = base_cvr * qs_modifier * goal_modifier
    
    # Add small random variation (±10%) for realism
    random_factor = np.random.uniform(0.9, 1.1)
    cvr *= random_factor
    
    return round(cvr, 4)


def simulate_multiple_auctions(
    keywords: List[Dict],
    num_auctions: int = 10000,
    seed: int = 12345
) -> List[Dict]:
    """
    Legacy function for backward compatibility
    Now uses volume-based estimation instead of fixed auction count
    """
    # Extract geo from keywords if available, default to US
    geo = 'US'
    campaign_context = None
    
    # Check if keywords have additional context
    if keywords and 'geo' in keywords[0]:
        geo = keywords[0]['geo']
    if keywords and 'campaign_context' in keywords[0]:
        campaign_context = keywords[0]['campaign_context']
    
    return simulate_volume_based_auctions(
        keywords=keywords,
        geo=geo,
        campaign_context=campaign_context,
        seed=seed
    )
