"""
Realistic Quality Score Engine

This module implements Google Ads Quality Score calculation based on:
1. Expected CTR (Click-Through Rate)
2. Ad Relevance 
3. Landing Page Experience

Quality Score = f(ExpectedCTR, AdRelevance, LandingPageExperience)
Scale: 1-10 (like Google Ads)
"""

import os
import re
import requests
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from urllib.parse import urlparse
import logging

# Import Gemini AI for semantic analysis
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Import sentence transformers for offline semantic similarity
try:
    from sentence_transformers import SentenceTransformer, util
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class AdData:
    """Ad data structure"""
    headlines: List[str]
    descriptions: List[str]
    display_url: str
    final_url: str
    extensions: List[str] = None
    device_targeting: str = "all"  # mobile, desktop, all
    ad_type: str = "search"  # search, display, shopping

@dataclass
class KeywordData:
    """Keyword data structure"""
    text: str
    match_type: str  # exact, phrase, broad
    intent: str = "informational"  # informational, navigational, transactional
    competition: str = "medium"  # low, medium, high

@dataclass
class QualityScoreComponents:
    """Quality Score component breakdown"""
    expected_ctr: float
    ad_relevance: float
    landing_page_experience: float
    extension_bonus: float
    raw_score: float
    final_score: float

class QualityScoreEngine:
    """
    Realistic Quality Score calculation engine based on Google Ads methodology
    """
    
    def __init__(self, gemini_api_key: str = None):
        """
        Initialize Quality Score Engine
        
        Args:
            gemini_api_key: API key for Gemini AI (optional)
        """
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.gemini_model = None
        self.sentence_model = None
        
        # Initialize AI models
        self._init_gemini()
        self._init_sentence_transformers()
        
        # Cache for landing page scores
        self.lp_cache = {}
        
        # Keyword intent patterns
        self.intent_patterns = {
            'transactional': [
                r'\b(buy|purchase|order|shop|store|price|cost|cheap|affordable|deal|sale)\b',
                r'\b(service|hire|book|appointment|contact|call|quote|estimate)\b'
            ],
            'navigational': [
                r'\b(website|site|login|sign in|account|profile)\b',
                r'\b(official|homepage|main page)\b'
            ],
            'informational': [
                r'\b(what|how|why|when|where|guide|tutorial|tips|advice|help)\b',
                r'\b(review|compare|best|top|list|examples)\b'
            ]
        }
    
    def _init_gemini(self):
        """Initialize Gemini AI model"""
        if GEMINI_AVAILABLE and self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini AI model initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini AI: {e}")
                self.gemini_model = None
        else:
            logger.info("Gemini AI not available - using offline methods")
    
    def _init_sentence_transformers(self):
        """Initialize sentence transformers for offline semantic similarity"""
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Sentence transformers model initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize sentence transformers: {e}")
                self.sentence_model = None
        else:
            logger.info("Sentence transformers not available - using rule-based methods")
    
    def calculate_quality_score(
        self, 
        ad: AdData, 
        keyword: KeywordData, 
        final_url: str = None
    ) -> QualityScoreComponents:
        """
        Calculate comprehensive Quality Score based on Google Ads methodology
        
        Args:
            ad: Ad data (headlines, descriptions, etc.)
            keyword: Keyword data (text, match type, intent)
            final_url: Landing page URL (optional, uses ad.final_url if not provided)
            
        Returns:
            QualityScoreComponents with detailed breakdown
        """
        final_url = final_url or ad.final_url
        
        # Calculate individual components
        expected_ctr = self.predict_expected_ctr(ad, keyword)
        ad_relevance = self.check_ad_relevance(ad, keyword)
        landing_page_score = self.calculate_landing_page_experience(final_url)
        extension_bonus = self.calculate_extension_bonus(ad)
        
        # Calculate raw Quality Score
        raw_score = expected_ctr * ad_relevance * landing_page_score * extension_bonus * 10
        
        # Cap at 10 and round to 1 decimal
        final_score = min(10.0, round(raw_score, 1))
        
        return QualityScoreComponents(
            expected_ctr=expected_ctr,
            ad_relevance=ad_relevance,
            landing_page_experience=landing_page_score,
            extension_bonus=extension_bonus,
            raw_score=raw_score,
            final_score=final_score
        )
    
    def predict_expected_ctr(self, ad: AdData, keyword: KeywordData) -> float:
        """
        Predict Expected CTR based on ad and keyword characteristics
        
        Args:
            ad: Ad data
            keyword: Keyword data
            
        Returns:
            Expected CTR (0.0 to 1.0)
        """
        base_ctr = 0.03  # Base CTR of 3%
        
        # Keyword intent bonus
        if keyword.intent == "transactional":
            base_ctr += 0.03
        elif keyword.intent == "navigational":
            base_ctr += 0.02
        elif keyword.intent == "informational":
            base_ctr += 0.01
        
        # Match type impact
        if keyword.match_type == "exact":
            base_ctr += 0.02
        elif keyword.match_type == "phrase":
            base_ctr += 0.01
        
        # Keyword inclusion in ad
        if self._keyword_in_ad(ad, keyword.text):
            base_ctr += 0.02
        
        # Device targeting
        if ad.device_targeting == "mobile":
            base_ctr += 0.01
        
        # Ad extensions bonus
        if ad.extensions and len(ad.extensions) > 2:
            base_ctr += 0.01
        
        # Competition impact
        if keyword.competition == "low":
            base_ctr += 0.01
        elif keyword.competition == "high":
            base_ctr -= 0.01
        
        return min(1.0, max(0.01, base_ctr))  # Cap between 1% and 100%
    
    def check_ad_relevance(self, ad: AdData, keyword: KeywordData) -> float:
        """
        Check ad relevance to keyword using AI or semantic similarity
        
        Args:
            ad: Ad data
            keyword: Keyword data
            
        Returns:
            Relevance score (0.0 to 1.0)
        """
        # Try Gemini AI first
        if self.gemini_model:
            try:
                return self._check_relevance_gemini(ad, keyword)
            except Exception as e:
                logger.warning(f"Gemini relevance check failed: {e}")
        
        # Fall back to sentence transformers
        if self.sentence_model:
            try:
                return self._check_relevance_sentence_transformers(ad, keyword)
            except Exception as e:
                logger.warning(f"Sentence transformers relevance check failed: {e}")
        
        # Fall back to rule-based method
        return self._check_relevance_rule_based(ad, keyword)
    
    def _check_relevance_gemini(self, ad: AdData, keyword: KeywordData) -> float:
        """Check relevance using Gemini AI"""
        headlines_text = " ".join(ad.headlines)
        descriptions_text = " ".join(ad.descriptions)
        
        prompt = f"""
        Score the semantic relevance of the following ad to the keyword '{keyword.text}'.
        
        Keyword: {keyword.text}
        Match Type: {keyword.match_type}
        Intent: {keyword.intent}
        
        Ad Headlines: {headlines_text}
        Ad Descriptions: {descriptions_text}
        
        Consider:
        - Semantic similarity between keyword and ad content
        - Intent alignment (informational vs transactional)
        - Match type appropriateness
        
        Output only a number between 0.0 and 1.0 (e.g., 0.85).
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            score_text = response.text.strip()
            
            # Extract number from response
            score_match = re.search(r'0\.\d+|1\.0', score_text)
            if score_match:
                return float(score_match.group())
            else:
                # Fallback parsing
                return float(score_text.split()[0]) if score_text.replace('.', '').isdigit() else 0.5
                
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return 0.5
    
    def _check_relevance_sentence_transformers(self, ad: AdData, keyword: KeywordData) -> float:
        """Check relevance using sentence transformers"""
        try:
            # Combine ad content
            ad_content = " ".join(ad.headlines + ad.descriptions)
            
            # Get embeddings
            keyword_embedding = self.sentence_model.encode([keyword.text])
            ad_embedding = self.sentence_model.encode([ad_content])
            
            # Calculate cosine similarity
            similarity = util.cos_sim(keyword_embedding, ad_embedding)[0][0]
            
            # Convert to 0-1 scale (cosine similarity is -1 to 1)
            relevance_score = (similarity + 1) / 2
            
            return float(relevance_score)
            
        except Exception as e:
            logger.error(f"Sentence transformers error: {e}")
            return 0.5
    
    def _check_relevance_rule_based(self, ad: AdData, keyword: KeywordData) -> float:
        """Check relevance using rule-based method"""
        score = 0.5  # Base score
        
        keyword_lower = keyword.text.lower()
        ad_content = " ".join(ad.headlines + ad.descriptions).lower()
        
        # Exact keyword match
        if keyword_lower in ad_content:
            score += 0.3
        
        # Partial keyword match
        keyword_words = keyword_lower.split()
        matched_words = sum(1 for word in keyword_words if word in ad_content)
        if matched_words > 0:
            score += 0.2 * (matched_words / len(keyword_words))
        
        # Intent alignment
        if keyword.intent == "transactional":
            transactional_words = ["buy", "purchase", "order", "shop", "price", "deal", "sale"]
            if any(word in ad_content for word in transactional_words):
                score += 0.1
        
        return min(1.0, score)
    
    def calculate_landing_page_experience(self, url: str) -> float:
        """
        Calculate landing page experience score using offline method
        
        Args:
            url: Landing page URL
            
        Returns:
            Landing page score (0.1 to 1.0)
        """
        # Check cache first
        if url in self.lp_cache:
            return self.lp_cache[url]
        
        try:
            score = self._analyze_landing_page_offline(url)
            self.lp_cache[url] = score
            return score
        except Exception as e:
            logger.warning(f"Landing page analysis failed for {url}: {e}")
            return 0.5  # Default score
    
    def _analyze_landing_page_offline(self, url: str) -> float:
        """Analyze landing page using offline method (no HTTP requests)"""
        try:
            # Parse URL to extract domain information
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            
            score = 1.0  # Start with perfect score
            
            # HTTPS check
            if not url.startswith("https://"):
                score -= 0.1
            
            # Domain quality heuristics
            if any(keyword in domain for keyword in ['localhost', 'test', 'demo', 'example']):
                score -= 0.3
            
            # Common high-quality domains get bonus
            high_quality_domains = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'facebook.com']
            if any(hq_domain in domain for hq_domain in high_quality_domains):
                score += 0.1
            
            # URL structure analysis
            path = parsed_url.path.lower()
            
            # Check for common landing page patterns
            if any(pattern in path for pattern in ['/landing', '/lp', '/offer', '/deal']):
                score += 0.05  # Landing page optimization
            
            # Check for problematic patterns
            if any(pattern in path for pattern in ['/404', '/error', '/not-found']):
                score -= 0.4
            
            # URL length penalty (very long URLs)
            if len(url) > 100:
                score -= 0.05
            
            # Subdomain analysis
            subdomain = domain.split('.')[0] if '.' in domain else ''
            if subdomain in ['www', 'shop', 'store', 'app']:
                score += 0.02  # Professional subdomains
            
            return max(0.1, min(1.0, round(score, 2)))
            
        except Exception as e:
            logger.error(f"Error in offline landing page analysis for {url}: {e}")
            return 0.5
    
    def _analyze_landing_page(self, url: str) -> float:
        """Analyze landing page using HTML heuristics"""
        try:
            response = requests.get(url, timeout=10, allow_redirects=True)
            html = response.text.lower()
            content_size = len(response.content)
            
            score = 1.0
            
            # Mobile optimization
            if "viewport" not in html:
                score -= 0.2
            
            # Page size check
            if content_size > 2_000_000:  # >2MB
                score -= 0.2
            elif content_size > 1_000_000:  # >1MB
                score -= 0.1
            
            # HTTPS check
            if not url.startswith("https://"):
                score -= 0.1
            
            # Structured data
            if "application/ld+json" not in html:
                score -= 0.1
            
            # Title tag
            if "<title>" not in html:
                score -= 0.1
            
            # Meta description
            if 'name="description"' not in html:
                score -= 0.05
            
            # Page load indicators
            if "loading" in html or "spinner" in html:
                score -= 0.05
            
            return max(0.1, round(score, 2))
            
        except Exception as e:
            logger.error(f"Error analyzing landing page {url}: {e}")
            return 0.5
    
    def calculate_extension_bonus(self, ad: AdData) -> float:
        """
        Calculate extension bonus factor
        
        Args:
            ad: Ad data
            
        Returns:
            Extension bonus factor (1.0 to 1.5)
        """
        if not ad.extensions:
            return 1.0
        
        num_extensions = len(ad.extensions)
        
        # Extension bonus calculation
        if num_extensions >= 4:
            return 1.5
        elif num_extensions >= 3:
            return 1.3
        elif num_extensions >= 2:
            return 1.2
        elif num_extensions >= 1:
            return 1.1
        else:
            return 1.0
    
    def classify_keyword_intent(self, keyword_text: str) -> str:
        """
        Classify keyword intent using patterns or AI
        
        Args:
            keyword_text: Keyword to classify
            
        Returns:
            Intent classification: informational, navigational, transactional
        """
        keyword_lower = keyword_text.lower()
        
        # Check transactional patterns
        for pattern in self.intent_patterns['transactional']:
            if re.search(pattern, keyword_lower):
                return "transactional"
        
        # Check navigational patterns
        for pattern in self.intent_patterns['navigational']:
            if re.search(pattern, keyword_lower):
                return "navigational"
        
        # Check informational patterns
        for pattern in self.intent_patterns['informational']:
            if re.search(pattern, keyword_lower):
                return "informational"
        
        # Default to informational
        return "informational"
    
    def _keyword_in_ad(self, ad: AdData, keyword: str) -> bool:
        """Check if keyword appears in ad content"""
        ad_content = " ".join(ad.headlines + ad.descriptions).lower()
        return keyword.lower() in ad_content

# Global instance
quality_score_engine = QualityScoreEngine()

def calculate_quality_score(ad: AdData, keyword: KeywordData, final_url: str = None) -> QualityScoreComponents:
    """Convenience function to calculate Quality Score"""
    return quality_score_engine.calculate_quality_score(ad, keyword, final_url)

def classify_keyword_intent(keyword_text: str) -> str:
    """Convenience function to classify keyword intent"""
    return quality_score_engine.classify_keyword_intent(keyword_text)
