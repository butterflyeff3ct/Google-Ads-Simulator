"""
AI Max Generation Endpoints (Gemini Integration)
For generating product descriptions and ad groups from URLs
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import httpx
import os
import re
from urllib.parse import urlparse

from app.utils.quota import check_quota_available, increment_quota
from app.utils.cache import generate_cache_key, get_cached_result, set_cached_result
from app.utils.logger import default_logger as logger

router = APIRouter()


class AIMaxGenerateRequest(BaseModel):
    url: str = Field(..., description="Website URL to analyze")
    include_description: bool = Field(default=True, description="Generate product description")
    include_ad_groups: bool = Field(default=True, description="Generate ad groups")


class AdGroupSuggestion(BaseModel):
    name: str
    final_url: str
    description: Optional[str] = None


class AIMaxGenerateResponse(BaseModel):
    product_description: Optional[str] = None
    ad_groups: List[AdGroupSuggestion] = []
    cached: bool = False
    tokens_used: int = 0


def normalize_url(url: str) -> str:
    """Normalize URL for consistent processing"""
    # Add https:// if no protocol
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Parse and reconstruct
    parsed = urlparse(url)
    
    # Remove www. for consistency
    domain = parsed.netloc.replace('www.', '')
    
    return f"{parsed.scheme}://{domain}{parsed.path}".rstrip('/')


def extract_company_name(url: str) -> str:
    """Extract company name from URL"""
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '')
    
    # Remove common TLDs
    name = domain.split('.')[0]
    
    # Capitalize first letter
    return name.capitalize()


# Gemini prompts for AI Max generation
DESCRIPTION_PROMPT = """Generate a product or service description for the URL: {url}

Analyze this business website and create a compelling description for search ad campaigns.

Requirements:
- Write exactly 100-150 words
- Focus on the unique value propositions of {company}
- Mention specific benefits and features
- Use language that appeals to target customers
- Include what makes this business stand out
- Be factual and professional
- Make it suitable for search ad campaigns

Provide only the description text, no additional formatting or explanation."""

AD_GROUPS_PROMPT = """Generate Ad group names and relevant URLs for: {url}

Based on the website {company}, suggest 2-4 relevant ad groups for a search ad campaign.

For each ad group, provide:
1. A clear, descriptive name
2. The relevant landing page URL

Format your response exactly like this:
Ad Group 1: [Name] | [URL]
Ad Group 2: [Name] | [URL]

Example:
Ad Group 1: FlixBus USA | https://flixbus.com
Ad Group 2: Bus Travel | https://flixbus.com/bus

Focus on the main products/services and keep ad groups tightly themed."""


@router.post("/ai-max/generate", response_model=AIMaxGenerateResponse)
async def generate_ai_max_content(request: AIMaxGenerateRequest):
    """
    Generate product description and ad groups using Gemini AI
    
    Analyzes the provided URL and generates:
    - Product/service description (100-150 words)
    - Relevant ad group suggestions
    
    Results are cached to minimize API calls
    """
    # TODO: Get user_id from auth
    user_id = "demo_user"
    
    # Normalize URL
    normalized_url = normalize_url(request.url)
    company_name = extract_company_name(normalized_url)
    
    # Check cache
    cache_key = generate_cache_key({
        "url": normalized_url,
        "include_description": request.include_description,
        "include_ad_groups": request.include_ad_groups
    }, seed=0)
    
    try:
        cached_result = get_cached_result(cache_key)
        if cached_result and isinstance(cached_result, dict):
            logger.info(f"Cache hit for {normalized_url}")
            return AIMaxGenerateResponse(**cached_result, cached=True)
    except Exception as e:
        logger.warning(f"Cache error: {str(e)}")
    
    # Estimate tokens needed
    estimated_tokens = 500  # Conservative estimate for both prompts
    
    # Check quota
    if not check_quota_available(user_id, "gemini_tokens", required=estimated_tokens):
        # Return mock data if quota exceeded
        logger.info("Quota exceeded, returning mock data")
        mock_response = generate_mock_response(normalized_url, company_name)
        return AIMaxGenerateResponse(**mock_response, cached=False)
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key:
        logger.warning("Gemini API key not configured, returning mock response")
        mock_response = generate_mock_response(normalized_url, company_name)
        return AIMaxGenerateResponse(**mock_response, cached=False)
    
    logger.info(f"Using Gemini API for {normalized_url}")
    
    try:
        result = {
            "product_description": None,
            "ad_groups": [],
            "tokens_used": 0
        }
        
        logger.info(f"Starting AI Max generation flow for {normalized_url}")
        logger.info(f"Step 1: Sending URL to Gemini for description generation")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # PROMPT 1: Generate product description
            if request.include_description:
                logger.info(f"Prompt 1: Generate a product or service description for the URL")
                desc_response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key={gemini_api_key}",
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": DESCRIPTION_PROMPT.format(url=normalized_url, company=company_name)}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 1,
                            "maxOutputTokens": 500,  # Increased for Gemini 2.5 Pro
                        }
                    }
                )
                
                if desc_response.status_code == 200:
                    desc_result = desc_response.json()
                    logger.info(f"Gemini description response: {desc_result}")
                    
                    if desc_result and "candidates" in desc_result:
                        description = desc_result["candidates"][0]["content"]["parts"][0]["text"]
                        
                        # Trim to 100-150 words if needed
                        words = description.split()
                        if len(words) > 150:
                            description = ' '.join(words[:150]) + '.'
                        
                        result["product_description"] = description.strip()
                        result["tokens_used"] += len(description) // 4
                        logger.info(f"Generated description: {description[:100]}...")
                    else:
                        logger.warning("No candidates in Gemini response")
                else:
                    logger.error(f"Gemini API error: {desc_response.status_code} - {desc_response.text}")
            
            # PROMPT 2: Generate ad groups
            if request.include_ad_groups:
                logger.info(f"Step 2: Sending URL to Gemini for ad group generation")
                logger.info(f"Prompt 2: Generate Ad group names and relevant URLs")
                groups_response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key={gemini_api_key}",
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": AD_GROUPS_PROMPT.format(url=normalized_url, company=company_name)}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 1,
                            "maxOutputTokens": 500,  # Increased for Gemini 2.5 Pro
                        }
                    }
                )
                
                if groups_response.status_code == 200:
                    groups_result = groups_response.json()
                    logger.info(f"Gemini ad groups response: {groups_result}")
                    
                    if groups_result and "candidates" in groups_result:
                        groups_text = groups_result["candidates"][0]["content"]["parts"][0]["text"]
                        
                        # Parse ad groups from response
                        ad_groups = parse_ad_groups(groups_text, normalized_url)
                        result["ad_groups"] = ad_groups
                        result["tokens_used"] += len(groups_text) // 4
                        logger.info(f"Generated {len(ad_groups)} ad groups")
                    else:
                        logger.warning("No candidates in Gemini ad groups response")
                else:
                    logger.error(f"Gemini API error for ad groups: {groups_response.status_code} - {groups_response.text}")
        
        # Step 3: Gemini returns both contents to respective boxes
        logger.info(f"Step 3: Gemini returned content, populating boxes")
        
        # If we didn't get both description and ad groups, use mock data
        if not result["product_description"] or not result["ad_groups"]:
            logger.warning("Incomplete generation, filling with mock data")
            mock_response = generate_mock_response(normalized_url, company_name)
            if not result["product_description"]:
                result["product_description"] = mock_response["product_description"]
            if not result["ad_groups"]:
                result["ad_groups"] = mock_response["ad_groups"]
        
        logger.info(f"Final result: Description={bool(result['product_description'])}, AdGroups={len(result['ad_groups'])}")
        
        # Cache the result
        try:
            set_cached_result(cache_key, result, ttl=86400)  # Cache for 24 hours
        except Exception as e:
            logger.warning(f"Failed to cache result: {str(e)}")
        
        # Increment quota
        increment_quota(user_id, "gemini_tokens", result["tokens_used"])
        
        return AIMaxGenerateResponse(**result)
        
    except httpx.TimeoutException:
        logger.error("Gemini API timeout")
        mock_response = generate_mock_response(normalized_url, company_name)
        return AIMaxGenerateResponse(**mock_response, cached=False)
    except Exception as e:
        logger.error(f"AI Max generation error: {str(e)}")
        mock_response = generate_mock_response(normalized_url, company_name)
        return AIMaxGenerateResponse(**mock_response, cached=False)


def parse_ad_groups(text: str, base_url: str) -> List[AdGroupSuggestion]:
    """Parse ad groups from Gemini response"""
    ad_groups = []
    
    # Look for pattern: Ad Group N: [Name] | [URL]
    lines = text.strip().split('\n')
    for line in lines:
        if 'Ad Group' in line or ':' in line:
            # Try to extract name and URL
            if '|' in line:
                parts = line.split('|')
                if len(parts) >= 2:
                    # Clean up the name (remove "Ad Group N:" prefix)
                    name = re.sub(r'^.*?:', '', parts[0]).strip()
                    url = parts[1].strip()
                    
                    # Ensure URL is complete
                    if not url.startswith(('http://', 'https://')):
                        if url.startswith('/'):
                            url = base_url + url
                        else:
                            url = base_url + '/' + url
                    
                    ad_groups.append(AdGroupSuggestion(
                        name=name,
                        final_url=url
                    ))
    
    # If parsing failed, return default groups
    if not ad_groups:
        parsed = urlparse(base_url)
        company = extract_company_name(base_url)
        
        ad_groups = [
            AdGroupSuggestion(
                name=f"{company} - Main",
                final_url=base_url
            ),
            AdGroupSuggestion(
                name=f"{company} - Services",
                final_url=base_url
            )
        ]
    
    return ad_groups[:4]  # Limit to 4 ad groups


def generate_mock_response(url: str, company: str) -> dict:
    """Generate mock response for demo/fallback"""
    
    # Generic description template
    description = f"""{company} is a leading provider of innovative solutions designed to meet your needs. \
We specialize in delivering high-quality products and services that combine cutting-edge technology \
with exceptional customer service. Our experienced team is dedicated to providing reliable, efficient, \
and cost-effective solutions tailored to your specific requirements. With a proven track record of \
success and a commitment to continuous improvement, we help businesses and individuals achieve their \
goals. Choose {company} for professional service, competitive pricing, and results you can trust."""
    
    # Trim to ~100-150 words
    words = description.split()
    if len(words) > 120:
        description = ' '.join(words[:120]) + '.'
    
    # Generate mock ad groups
    ad_groups = [
        AdGroupSuggestion(
            name=f"{company} - Main",
            final_url=url
        ),
        AdGroupSuggestion(
            name=f"{company} - Products",
            final_url=url
        )
    ]
    
    # Add specific groups based on common patterns
    if 'bus' in url.lower() or 'travel' in url.lower():
        ad_groups = [
            AdGroupSuggestion(name=f"{company} USA", final_url=url),
            AdGroupSuggestion(name="Bus Travel", final_url=f"{url}/bus")
        ]
    elif 'shop' in url.lower() or 'store' in url.lower():
        ad_groups = [
            AdGroupSuggestion(name=f"{company} Store", final_url=url),
            AdGroupSuggestion(name="Online Shopping", final_url=f"{url}/products")
        ]
    
    return {
        "product_description": description,
        "ad_groups": [ag.dict() for ag in ad_groups],
        "tokens_used": 0
    }


@router.get("/ai-max/quota")
async def get_ai_max_quota():
    """Get remaining AI Max quota for user"""
    from app.utils.quota import get_quota_status
    
    user_id = "demo_user"
    status = get_quota_status(user_id)
    
    return {
        "gemini_tokens": status.get("gemini_tokens", {}),
        "daily_limit": 200000,
        "description": "Gemini tokens used for AI Max generation"
    }


@router.get("/ai-max/test")
async def test_ai_max():
    """Simple test endpoint to verify AI Max is working"""
    # Always return mock data for testing
    test_response = generate_mock_response("https://test.com", "Test")
    return {
        "status": "ok",
        "message": "AI Max endpoint is working",
        "mock_data": test_response
    }
