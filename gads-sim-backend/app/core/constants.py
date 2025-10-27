"""
Global Constants for Search Campaign Simulation
"""

# Simulation version (increment when logic changes)
SIM_VERSION = "v1.0.0"

# Auction parameters
MIN_AD_RANK = 1.0
MAX_POSITION = 10
DEFAULT_QUALITY_SCORE = 7

# Bidding strategies
BIDDING_STRATEGIES = {
    "manual_cpc": "Manual Cost-Per-Click",
    "target_cpa": "Target Cost-Per-Acquisition",
    "target_roas": "Target Return on Ad Spend",
    "maximize_clicks": "Maximize Clicks",
    "target_impression_share": "Target Impression Share"
}

# Match types
MATCH_TYPES = ["exact", "phrase", "broad"]

# CTR base rates by position (deterministic model)
CTR_BY_POSITION = {
    1: 0.35,
    2: 0.15,
    3: 0.10,
    4: 0.07,
    5: 0.05,
    6: 0.03,
    7: 0.02,
    8: 0.015,
    9: 0.01,
    10: 0.005
}

# Conversion rate modifiers by quality score
CVR_QS_MODIFIER = {
    1: 0.3,
    2: 0.4,
    3: 0.5,
    4: 0.6,
    5: 0.7,
    6: 0.8,
    7: 1.0,   # baseline
    8: 1.15,
    9: 1.3,
    10: 1.5
}

# Budget pacing (hourly distribution across 24 hours)
HOURLY_PACING = [
    0.01, 0.01, 0.01, 0.01, 0.02, 0.03,  # 12am-6am
    0.05, 0.07, 0.08, 0.08, 0.07, 0.07,  # 6am-12pm
    0.06, 0.06, 0.06, 0.07, 0.08, 0.07,  # 12pm-6pm
    0.06, 0.05, 0.04, 0.03, 0.02, 0.01   # 6pm-12am
]

# API quotas (per user per day)
QUOTA_LIMITS = {
    "simulate": 100,           # simulation runs
    "gemini_tokens": 200000,   # Gemini API tokens
    "keyword_ideas": 20,       # keyword ideas calls
    "keyword_metrics": 10      # metrics calls
}

# Cache TTL
CACHE_TTL_SECONDS = 86400  # 24 hours
KEYWORD_CACHE_TTL = 172800  # 48 hours

# Performance targets
TARGET_SIM_TIME_MS = 1000  # for 10K auctions
TARGET_API_LATENCY_MS = 300
