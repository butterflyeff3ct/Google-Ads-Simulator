"""
Search Volume Estimation Engine

This module replaces random auction generation with logic-based volume estimation:
1. Static volume database for common keywords
2. Match type modifiers (exact < phrase < broad)
3. Geographic modifiers based on location targeting
4. Daily auction calculation: volume * matchTypeModifier * geoModifier
"""

import json
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import numpy as np

@dataclass
class VolumeData:
    """Search volume data for a keyword"""
    keyword: str
    monthly_searches: int
    competition: str  # 'Low', 'Medium', 'High'
    competition_index: float  # 0.0 to 1.0
    avg_cpc: float
    cpc_low: float
    cpc_high: float

@dataclass
class AuctionEstimate:
    """Estimated daily auctions for a keyword"""
    keyword: str
    match_type: str
    daily_auctions: int
    volume_source: str  # 'static', 'estimated', 'fallback'
    confidence: float  # 0.0 to 1.0

class VolumeEstimationEngine:
    """Main engine for search volume estimation"""
    
    def __init__(self):
        self.static_volume_db = self._load_static_volume_db()
        self.match_type_modifiers = self._get_match_type_modifiers()
        self.geo_modifiers = self._get_geo_modifiers()
        
    def _load_static_volume_db(self) -> Dict[str, VolumeData]:
        """Load static volume database"""
        # This would typically load from a JSON file or database
        # For now, we'll create a comprehensive sample dataset
        return {
            # Business Services
            'plumber': VolumeData('plumber', 450000, 'High', 0.8, 8.50, 5.20, 12.80),
            'electrician': VolumeData('electrician', 320000, 'High', 0.75, 12.30, 8.50, 18.20),
            'hvac repair': VolumeData('hvac repair', 180000, 'Medium', 0.65, 15.80, 10.20, 22.50),
            'roofing contractor': VolumeData('roofing contractor', 95000, 'Medium', 0.60, 18.90, 12.50, 28.40),
            'landscaping services': VolumeData('landscaping services', 120000, 'Medium', 0.55, 14.20, 9.80, 20.10),
            
            # Technology
            'web design': VolumeData('web design', 280000, 'High', 0.85, 12.50, 8.20, 18.90),
            'seo services': VolumeData('seo services', 150000, 'High', 0.80, 25.40, 18.50, 35.20),
            'digital marketing': VolumeData('digital marketing', 220000, 'High', 0.75, 18.90, 12.80, 28.50),
            'software development': VolumeData('software development', 180000, 'Medium', 0.70, 22.10, 15.60, 31.80),
            'mobile app development': VolumeData('mobile app development', 85000, 'Medium', 0.65, 28.90, 20.50, 40.20),
            
            # Healthcare
            'dentist': VolumeData('dentist', 380000, 'High', 0.75, 9.80, 6.50, 15.20),
            'chiropractor': VolumeData('chiropractor', 120000, 'Medium', 0.60, 11.20, 7.80, 16.90),
            'physical therapy': VolumeData('physical therapy', 95000, 'Medium', 0.55, 13.50, 9.20, 19.80),
            'mental health counseling': VolumeData('mental health counseling', 65000, 'Low', 0.45, 16.80, 11.50, 24.20),
            'veterinarian': VolumeData('veterinarian', 150000, 'Medium', 0.65, 8.90, 5.80, 13.50),
            
            # Legal Services
            'personal injury lawyer': VolumeData('personal injury lawyer', 280000, 'High', 0.90, 45.20, 32.80, 68.50),
            'divorce lawyer': VolumeData('divorce lawyer', 180000, 'High', 0.85, 38.90, 28.50, 55.20),
            'criminal defense attorney': VolumeData('criminal defense attorney', 120000, 'High', 0.80, 42.10, 30.80, 58.90),
            'estate planning lawyer': VolumeData('estate planning lawyer', 85000, 'Medium', 0.70, 35.60, 25.20, 48.90),
            'business lawyer': VolumeData('business lawyer', 95000, 'Medium', 0.65, 28.90, 20.50, 40.20),
            
            # Real Estate
            'real estate agent': VolumeData('real estate agent', 320000, 'High', 0.80, 12.50, 8.90, 18.20),
            'home inspector': VolumeData('home inspector', 45000, 'Medium', 0.55, 18.90, 12.80, 28.50),
            'property management': VolumeData('property management', 38000, 'Low', 0.50, 15.20, 10.50, 22.80),
            'commercial real estate': VolumeData('commercial real estate', 25000, 'Medium', 0.60, 22.80, 16.20, 32.50),
            'real estate investment': VolumeData('real estate investment', 18000, 'Low', 0.45, 19.50, 13.80, 28.20),
            
            # Automotive
            'auto repair': VolumeData('auto repair', 280000, 'High', 0.75, 8.90, 6.20, 13.50),
            'car insurance': VolumeData('car insurance', 450000, 'High', 0.85, 12.50, 8.90, 18.20),
            'used cars': VolumeData('used cars', 680000, 'High', 0.90, 6.80, 4.50, 10.20),
            'auto parts': VolumeData('auto parts', 180000, 'Medium', 0.65, 4.20, 2.80, 6.90),
            'car detailing': VolumeData('car detailing', 65000, 'Medium', 0.55, 9.80, 6.50, 15.20),
            
            # Food & Restaurant
            'restaurant': VolumeData('restaurant', 520000, 'High', 0.80, 3.20, 2.10, 5.80),
            'pizza delivery': VolumeData('pizza delivery', 180000, 'High', 0.75, 2.80, 1.90, 4.50),
            'catering services': VolumeData('catering services', 85000, 'Medium', 0.60, 8.90, 6.20, 13.50),
            'food truck': VolumeData('food truck', 45000, 'Medium', 0.55, 5.20, 3.50, 8.90),
            'bakery': VolumeData('bakery', 65000, 'Medium', 0.50, 4.80, 3.20, 7.50),
            
            # Fitness & Wellness
            'gym': VolumeData('gym', 280000, 'High', 0.75, 4.20, 2.80, 6.90),
            'personal trainer': VolumeData('personal trainer', 120000, 'Medium', 0.60, 8.90, 6.20, 13.50),
            'yoga classes': VolumeData('yoga classes', 85000, 'Medium', 0.55, 6.80, 4.50, 10.20),
            'massage therapy': VolumeData('massage therapy', 95000, 'Medium', 0.60, 9.80, 6.50, 15.20),
            'nutritionist': VolumeData('nutritionist', 45000, 'Low', 0.45, 12.50, 8.90, 18.20),
            
            # Education & Training
            'online courses': VolumeData('online courses', 180000, 'High', 0.80, 8.90, 6.20, 13.50),
            'language learning': VolumeData('language learning', 150000, 'High', 0.75, 6.80, 4.50, 10.20),
            'coding bootcamp': VolumeData('coding bootcamp', 65000, 'Medium', 0.65, 15.20, 10.50, 22.80),
            'music lessons': VolumeData('music lessons', 85000, 'Medium', 0.55, 9.80, 6.50, 15.20),
            'tutoring services': VolumeData('tutoring services', 120000, 'Medium', 0.60, 8.90, 6.20, 13.50),
            
            # E-commerce
            'online shopping': VolumeData('online shopping', 1200000, 'High', 0.90, 2.10, 1.40, 3.20),
            'free shipping': VolumeData('free shipping', 450000, 'High', 0.85, 1.80, 1.20, 2.80),
            'discount codes': VolumeData('discount codes', 280000, 'High', 0.80, 2.50, 1.70, 3.80),
            'product reviews': VolumeData('product reviews', 180000, 'Medium', 0.70, 1.90, 1.30, 2.90),
            'compare prices': VolumeData('compare prices', 95000, 'Medium', 0.65, 2.20, 1.50, 3.20),
            
            # Travel & Tourism
            'hotel booking': VolumeData('hotel booking', 380000, 'High', 0.85, 3.20, 2.10, 5.80),
            'flight deals': VolumeData('flight deals', 280000, 'High', 0.80, 4.50, 3.00, 6.80),
            'vacation rental': VolumeData('vacation rental', 120000, 'Medium', 0.70, 2.80, 1.90, 4.50),
            'travel insurance': VolumeData('travel insurance', 65000, 'Medium', 0.60, 5.20, 3.50, 8.90),
            'tourist attractions': VolumeData('tourist attractions', 85000, 'Low', 0.50, 1.90, 1.30, 2.90),
            
            # Financial Services
            'credit card': VolumeData('credit card', 450000, 'High', 0.90, 8.90, 6.20, 13.50),
            'mortgage rates': VolumeData('mortgage rates', 280000, 'High', 0.85, 12.50, 8.90, 18.20),
            'investment advice': VolumeData('investment advice', 120000, 'High', 0.80, 18.90, 12.80, 28.50),
            'tax preparation': VolumeData('tax preparation', 180000, 'High', 0.75, 15.20, 10.50, 22.80),
            'insurance quotes': VolumeData('insurance quotes', 220000, 'High', 0.80, 8.90, 6.20, 13.50),
            
            # Home & Garden
            'home improvement': VolumeData('home improvement', 320000, 'High', 0.75, 6.80, 4.50, 10.20),
            'furniture': VolumeData('furniture', 280000, 'High', 0.80, 4.20, 2.80, 6.90),
            'home decor': VolumeData('home decor', 180000, 'Medium', 0.70, 3.20, 2.10, 5.80),
            'garden supplies': VolumeData('garden supplies', 95000, 'Medium', 0.60, 2.80, 1.90, 4.50),
            'cleaning services': VolumeData('cleaning services', 120000, 'Medium', 0.65, 8.90, 6.20, 13.50),
            
            # Fashion & Beauty
            'clothing': VolumeData('clothing', 680000, 'High', 0.85, 2.10, 1.40, 3.20),
            'shoes': VolumeData('shoes', 450000, 'High', 0.80, 2.50, 1.70, 3.80),
            'makeup': VolumeData('makeup', 280000, 'High', 0.75, 3.20, 2.10, 5.80),
            'hair salon': VolumeData('hair salon', 150000, 'Medium', 0.60, 6.80, 4.50, 10.20),
            'nail salon': VolumeData('nail salon', 85000, 'Medium', 0.55, 5.20, 3.50, 8.90),
            
            # Generic Business Terms
            'near me': VolumeData('near me', 1200000, 'High', 0.90, 1.20, 0.80, 1.80),
            'best': VolumeData('best', 2800000, 'High', 0.95, 0.80, 0.50, 1.20),
            'cheap': VolumeData('cheap', 1800000, 'High', 0.90, 0.90, 0.60, 1.40),
            'affordable': VolumeData('affordable', 1200000, 'High', 0.85, 1.10, 0.70, 1.60),
            'professional': VolumeData('professional', 850000, 'Medium', 0.70, 2.20, 1.50, 3.20),
            'local': VolumeData('local', 2200000, 'High', 0.90, 0.70, 0.50, 1.00),
            'reviews': VolumeData('reviews', 1500000, 'High', 0.85, 1.50, 1.00, 2.20),
            'services': VolumeData('services', 3200000, 'High', 0.90, 0.60, 0.40, 0.90),
            'company': VolumeData('company', 2800000, 'High', 0.85, 0.80, 0.50, 1.20),
            'business': VolumeData('business', 2500000, 'High', 0.80, 0.90, 0.60, 1.40)
        }
    
    def _get_match_type_modifiers(self) -> Dict[str, float]:
        """Get match type modifiers for auction participation"""
        return {
            'exact': 1.0,      # Exact match gets full volume
            'phrase': 0.7,     # Phrase match gets 70% of volume
            'broad': 0.4       # Broad match gets 40% of volume (but higher CTR)
        }
    
    def _get_geo_modifiers(self) -> Dict[str, float]:
        """Get geographic modifiers based on location targeting"""
        return {
            # Major markets
            'US': 1.0,
            'CA': 0.15,        # Canada ~15% of US volume
            'UK': 0.12,        # UK ~12% of US volume
            'AU': 0.08,        # Australia ~8% of US volume
            'DE': 0.10,        # Germany ~10% of US volume
            'FR': 0.08,        # France ~8% of US volume
            'IT': 0.06,        # Italy ~6% of US volume
            'ES': 0.05,        # Spain ~5% of US volume
            
            # Regional modifiers
            'EU': 0.25,        # All EU countries combined
            
            # Fallback for unknown locations
            'default': 0.05    # Unknown locations get 5% of US volume
        }
    
    def estimate_daily_auctions(self, keyword: str, match_type: str, geo: str) -> AuctionEstimate:
        """
        Estimate daily auctions for a keyword based on:
        - Static volume data
        - Match type modifier
        - Geographic modifier
        
        Formula: daily_auctions = (monthly_searches / 30) * match_type_modifier * geo_modifier
        """
        # Normalize keyword for lookup
        normalized_keyword = keyword.lower().strip()
        
        # Get base volume data
        volume_data = self.static_volume_db.get(normalized_keyword)
        
        if volume_data:
            # Use static data
            monthly_searches = volume_data.monthly_searches
            volume_source = 'static'
            confidence = 0.9
        else:
            # Estimate based on keyword characteristics
            monthly_searches = self._estimate_volume_from_keyword(normalized_keyword)
            volume_source = 'estimated'
            confidence = 0.6
        
        # Get modifiers
        match_modifier = self.match_type_modifiers.get(match_type, 0.5)
        geo_modifier = self.geo_modifiers.get(geo, self.geo_modifiers['default'])
        
        # Calculate daily auctions
        daily_auctions = int((monthly_searches / 30) * match_modifier * geo_modifier)
        
        # Ensure minimum of 1 auction per day
        daily_auctions = max(1, daily_auctions)
        
        return AuctionEstimate(
            keyword=keyword,
            match_type=match_type,
            daily_auctions=daily_auctions,
            volume_source=volume_source,
            confidence=confidence
        )
    
    def _estimate_volume_from_keyword(self, keyword: str) -> int:
        """
        Estimate search volume for unknown keywords based on:
        - Keyword length (shorter = higher volume)
        - Common words (higher volume)
        - Business terms (medium volume)
        - Long-tail terms (lower volume)
        """
        # Base volume by keyword length
        length_modifiers = {
            1: 500000,   # Single character (rare)
            2: 200000,   # Two characters
            3: 100000,   # Three characters
            4: 80000,    # Four characters
            5: 60000,    # Five characters
            6: 40000,    # Six characters
            7: 25000,    # Seven characters
            8: 15000,    # Eight characters
            9: 10000,    # Nine characters
            10: 8000,    # Ten characters
        }
        
        # Get base volume by length
        base_volume = length_modifiers.get(len(keyword), 5000)
        
        # High-volume word modifiers
        high_volume_words = ['near', 'me', 'best', 'cheap', 'affordable', 'local', 'reviews', 'services', 'company', 'business']
        if any(word in keyword for word in high_volume_words):
            base_volume *= 2.0
        
        # Business term modifiers
        business_terms = ['service', 'company', 'business', 'professional', 'expert', 'specialist']
        if any(term in keyword for term in business_terms):
            base_volume *= 1.5
        
        # Long-tail modifiers (more specific = lower volume)
        if len(keyword.split()) > 2:
            base_volume *= 0.3
        elif len(keyword.split()) == 2:
            base_volume *= 0.7
        
        # Brand name detection (lower volume for specific brands)
        if keyword.isupper() or keyword[0].isupper():
            base_volume *= 0.2
        
        return int(base_volume)
    
    def get_volume_data(self, keyword: str) -> Optional[VolumeData]:
        """Get volume data for a keyword if available"""
        normalized_keyword = keyword.lower().strip()
        return self.static_volume_db.get(normalized_keyword)
    
    def get_competition_level(self, keyword: str) -> str:
        """Get competition level for a keyword"""
        volume_data = self.get_volume_data(keyword)
        if volume_data:
            return volume_data.competition
        
        # Estimate competition based on keyword characteristics
        if len(keyword.split()) == 1 and len(keyword) <= 6:
            return 'High'  # Short, single-word keywords are usually competitive
        elif len(keyword.split()) >= 3:
            return 'Low'   # Long-tail keywords are usually less competitive
        else:
            return 'Medium'
    
    def get_estimated_cpc(self, keyword: str, match_type: str) -> Tuple[float, float, float]:
        """
        Get estimated CPC range for a keyword
        Returns: (low_cpc, avg_cpc, high_cpc)
        """
        volume_data = self.get_volume_data(keyword)
        if volume_data:
            base_low = volume_data.cpc_low
            base_avg = volume_data.avg_cpc
            base_high = volume_data.cpc_high
        else:
            # Estimate CPC based on competition and keyword characteristics
            competition = self.get_competition_level(keyword)
            if competition == 'High':
                base_low, base_avg, base_high = 8.0, 15.0, 25.0
            elif competition == 'Medium':
                base_low, base_avg, base_high = 4.0, 8.0, 15.0
            else:
                base_low, base_avg, base_high = 2.0, 5.0, 10.0
        
        # Apply match type modifiers to CPC
        match_modifier = self.match_type_modifiers.get(match_type, 0.5)
        
        # Exact match typically has higher CPC (more targeted)
        if match_type == 'exact':
            cpc_multiplier = 1.2
        elif match_type == 'phrase':
            cpc_multiplier = 1.0
        else:  # broad
            cpc_multiplier = 0.8
        
        return (
            base_low * cpc_multiplier,
            base_avg * cpc_multiplier,
            base_high * cpc_multiplier
        )
    
    def get_keyword_suggestions(self, seed_keyword: str, max_suggestions: int = 10) -> List[VolumeData]:
        """
        Get keyword suggestions based on seed keyword
        """
        suggestions = []
        normalized_seed = seed_keyword.lower().strip()
        
        # Find keywords that contain the seed keyword
        for keyword, volume_data in self.static_volume_db.items():
            if normalized_seed in keyword or keyword in normalized_seed:
                suggestions.append(volume_data)
        
        # Sort by monthly searches (descending)
        suggestions.sort(key=lambda x: x.monthly_searches, reverse=True)
        
        return suggestions[:max_suggestions]

# Global instance
volume_engine = VolumeEstimationEngine()

def estimate_keyword_auctions(keyword: str, match_type: str, geo: str) -> AuctionEstimate:
    """Convenience function to estimate auctions for a keyword"""
    return volume_engine.estimate_daily_auctions(keyword, match_type, geo)

def get_keyword_volume_data(keyword: str) -> Optional[VolumeData]:
    """Convenience function to get volume data"""
    return volume_engine.get_volume_data(keyword)

def get_competition_level(keyword: str) -> str:
    """Convenience function to get competition level"""
    return volume_engine.get_competition_level(keyword)

def get_estimated_cpc(keyword: str, match_type: str) -> Tuple[float, float, float]:
    """Convenience function to get estimated CPC"""
    return volume_engine.get_estimated_cpc(keyword, match_type)
