/**
 * Extended types for full campaign setup wizard
 */

// Step 1: Campaign Goals
export type CampaignGoal =
  | 'sales'
  | 'leads'
  | 'website_traffic'
  | 'product_brand_consideration'
  | 'brand_awareness_reach'
  | 'app_promotion'
  | 'local_store_visits'
  | 'no_goal'

// Step 2: Campaign Type
export type CampaignType = 'search' | 'display' | 'shopping' | 'video' | 'performance_max' | 'discovery' | 'app' | 'local'

// Step 3: Conversion Goals
export interface ConversionGoal {
  id: string
  name: string
  type: 'website_visits' | 'phone_calls' | 'app_downloads' | 'store_visits' | 'custom'
  is_primary: boolean
  value?: number
}

// Step 4: Bidding Strategy
export type BiddingStrategy =
  | 'manual_cpc'
  | 'maximize_conversions'
  | 'maximize_conversion_value'
  | 'maximize_clicks'
  | 'target_impression_share'
  | 'target_cpa'
  | 'target_roas'

export interface BiddingConfig {
  strategy: BiddingStrategy
  target_cpa?: number
  target_roas?: number
  max_cpc?: number
  impression_share_location?: 'anywhere' | 'top_of_page' | 'absolute_top'
  impression_share_target?: number
  focus: 'conversions' | 'conversion_value' | 'clicks' | 'impression_share'
}

// Step 5: Campaign Settings
export interface Location {
  name: string
  type: 'country' | 'region' | 'city' | 'radius'
  code?: string
}

export type LocationTarget = 'presence' | 'interest'

export interface AudienceSegment {
  id: string
  name: string
  type: 'affinity' | 'in_market' | 'life_events' | 'remarketing' | 'custom'
  mode: 'observation' | 'targeting'
}

export interface CampaignSettings {
  name: string
  networks: {
    search: boolean
    display: boolean
  }
  start_date?: string
  end_date?: string
  locations: Location[]
  location_target: LocationTarget
  excluded_locations: Location[]
  languages: string[]
  audience_segments: AudienceSegment[]
  daily_budget: number
}

// Step 6: Ad Group Setup
export interface Keyword {
  text: string
  match_type: 'exact' | 'phrase' | 'broad'
  bid?: number
  quality_score: number
}

export interface NegativeKeyword {
  text: string
  match_type: 'exact' | 'phrase' | 'broad'
}

export interface AdGroup {
  id: string
  name: string
  type: 'standard' | 'dynamic'
  default_bid?: number
  keywords: Keyword[]
  negative_keywords: NegativeKeyword[]
}

// Step 7: Ad Creation (Responsive Search Ads)
export interface HeadlinePin {
  position: number | null
}

export interface DescriptionPin {
  position: number | null
}

export interface ResponsiveSearchAd {
  id: string
  final_url: string
  display_path_1?: string
  display_path_2?: string
  headlines: Array<{
    text: string
    pin?: HeadlinePin
  }>
  descriptions: Array<{
    text: string
    pin?: DescriptionPin
  }>
}

// Step 8: Ad Extensions/Assets
export interface SitelinkAsset {
  link_text: string
  url: string
  description_1?: string
  description_2?: string
}

export interface CalloutAsset {
  text: string
}

export interface CallAsset {
  phone_number: string
  country_code: string
}

export interface StructuredSnippet {
  header: string
  values: string[]
}

export interface AdAssets {
  sitelinks: SitelinkAsset[]
  callouts: CalloutAsset[]
  call?: CallAsset
  structured_snippets: StructuredSnippet[]
}

// Complete Campaign Data
export interface FullCampaign {
  goal: CampaignGoal
  type: CampaignType
  conversion_goals: ConversionGoal[]
  bidding: BiddingConfig
  settings: CampaignSettings
  ad_groups: AdGroup[]
  ads: ResponsiveSearchAd[]
  assets: AdAssets
}

// Simulation Settings
export interface SimulationSettings {
  geo: string
  language: string
  num_auctions: number
  base_cvr: number
  pacing_type: string
}

export interface KeywordIdea {
  text: string
  monthly_searches: number
  competition: string
  competition_index?: number
  cpc_low: number
  cpc_high: number
}

// For API compatibility
export interface SimulationRequest {
  campaign: {
    name: string
    type: string
    daily_budget: number
    bidding_strategy: string
  }
  keywords: Keyword[]
  settings: SimulationSettings
  seed?: number
  debug?: boolean
}
