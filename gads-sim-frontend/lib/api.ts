/**
 * API Client for Google Ads Simulator Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface Keyword {
  text: string
  match_type: 'exact' | 'phrase' | 'broad'
  bid: number
  quality_score: number
}

export interface Campaign {
  name: string
  type: string
  daily_budget: number
  bidding_strategy: string
}

export interface SimulationSettings {
  geo: string
  language: string
  num_auctions: number
  base_cvr: number
  pacing_type: string
}

export interface SimulationRequest {
  campaign: Campaign
  keywords: Keyword[]
  settings: SimulationSettings
  seed?: number
  debug?: boolean
}

export interface SimulationResponse {
  run_id: string
  sim_version: string
  metrics: any
  by_keyword: any[]
  duration_ms: number
  cached: boolean
}

export interface KeywordIdeasRequest {
  keyword_seed?: string[]
  url?: string
  product_description?: string
  geo: string
  language: string
}

export interface KeywordIdea {
  text: string
  monthly_searches: number
  competition: string
  competition_index?: number
  cpc_low: number
  cpc_high: number
}

export interface KeywordIdeasResponse {
  keywords: KeywordIdea[]
  cached: boolean
  source: string
}

/**
 * Run a deterministic, logic-backed simulation
 * Uses the enhanced cached simulation endpoint with confidence ranges and metrics breakdown
 */
export async function runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
  // Use the cached-simulate endpoint for deterministic, reproducible results
  const response = await fetch(`${API_URL}/cached-simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      use_cache: true,  // Enable caching for reproducible results
      include_confidence_ranges: true,  // Include confidence ranges in results
      include_metrics_breakdown: true   // Include comprehensive metrics breakdown
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Simulation failed')
  }

  return response.json()
}

/**
 * Get simulation results by ID
 */
export async function getSimulationResults(runId: string): Promise<any> {
  const response = await fetch(`${API_URL}/results/${runId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch results')
  }

  return response.json()
}

/**
 * Get keyword ideas
 */
export async function getKeywordIdeas(request: KeywordIdeasRequest): Promise<KeywordIdeasResponse> {
  const response = await fetch(`${API_URL}/keywords/ideas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to get keyword ideas')
  }

  return response.json()
}

/**
 * Health check
 */
export async function healthCheck(): Promise<any> {
  const response = await fetch(API_URL.replace('/api', '/health'))
  return response.json()
}

/**
 * Export simulation results as CSV
 */
export function exportSimulationCSV(runId: string): string {
  const storedResults = localStorage.getItem(`sim_${runId}`)
  if (!storedResults) return ''
  
  const data = JSON.parse(storedResults)
  const headers = ['Keyword', 'Match Type', 'Impressions', 'Clicks', 'CTR', 'Avg Position', 'Avg CPC', 'Cost', 'Conversions', 'CVR']
  const rows = data.by_keyword?.map((kw: any) => [
    kw.text,
    kw.match_type,
    kw.impressions,
    kw.clicks,
    kw.ctr,
    kw.avg_position || 'N/A',
    kw.avg_cpc,
    kw.cost,
    kw.conversions,
    kw.cvr || 0
  ]) || []
  
  const csvContent = [headers, ...rows]
    .map(row => row.map((field: any) => `"${field}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  return URL.createObjectURL(blob)
}

/**
 * Export simulation results as JSON
 */
export function exportSimulationJSON(runId: string): string {
  const storedResults = localStorage.getItem(`sim_${runId}`)
  if (!storedResults) return ''
  
  const data = JSON.parse(storedResults)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  return URL.createObjectURL(blob)
}

/**
 * AI Max - Generate product description and ad groups
 */
export interface AIMaxGenerateRequest {
  url: string
  include_description?: boolean
  include_ad_groups?: boolean
}

export interface AdGroupSuggestion {
  name: string
  final_url: string
  description?: string
}

export interface AIMaxGenerateResponse {
  product_description?: string
  ad_groups: AdGroupSuggestion[]
  cached: boolean
  tokens_used: number
}

export async function generateAIMaxContent(request: AIMaxGenerateRequest): Promise<AIMaxGenerateResponse> {
  const response = await fetch(`${API_URL}/ai-max/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'AI Max generation failed')
  }

  return response.json()
}

/**
 * Get AI Max quota
 */
export async function getAIMaxQuota(): Promise<any> {
  const response = await fetch(`${API_URL}/ai-max/quota`)
  return response.json()
}

/**
 * Keyword Planner - Historical Metrics
 */
export interface HistoricalMetricsRequest {
  keywords: string[]
  geo: string
  language: string
  date_range?: string
}

export interface HistoricalMetric {
  keyword: string
  avg_monthly_searches: number
  competition: string
  competition_index?: number
  low_cpc: number
  high_cpc: number
  avg_cpc: number
}

export interface HistoricalMetricsResponse {
  metrics: HistoricalMetric[]
  cached: boolean
  source: string
}

export async function getHistoricalMetrics(request: HistoricalMetricsRequest): Promise<HistoricalMetricsResponse> {
  const response = await fetch(`${API_URL}/keywords/historical-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to get historical metrics')
  }

  return response.json()
}

/**
 * Keyword Planner - Forecast Metrics
 */
export interface ForecastMetricsRequest {
  keywords: string[]
  campaign_budget: number
  geo: string
  language: string
  bidding_strategy: string
}

export interface KeywordForecast {
  keyword: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  cvr: number
}

export interface CampaignForecast {
  total_impressions: number
  total_clicks: number
  total_cost: number
  total_conversions: number
  avg_ctr: number
  avg_cvr: number
}

export interface ForecastMetricsResponse {
  keywords: KeywordForecast[]
  campaign_forecast: CampaignForecast
  budget_utilization: number
  cached: boolean
  source: string
}

export async function getForecastMetrics(request: ForecastMetricsRequest): Promise<ForecastMetricsResponse> {
  const response = await fetch(`${API_URL}/keywords/forecast-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to get forecast metrics')
  }

  return response.json()
}
