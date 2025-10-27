'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { getForecastMetrics, ForecastMetricsRequest, ForecastMetricsResponse } from '@/lib/api'

export default function SearchVolumeForecasts() {
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ForecastMetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetStarted = async () => {
    if (!keywords.trim()) {
      setError('Please enter at least one keyword')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Parse keywords from textarea
      const keywordList = keywords
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const request: ForecastMetricsRequest = {
        keywords: keywordList,
        campaign_budget: 100, // Default budget for forecast calculations
        geo: 'US',
        language: 'en',
        bidding_strategy: 'manual_cpc' // Default bidding strategy
      }

      const response = await getForecastMetrics(request)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get forecast metrics')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return keywords.trim().length > 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link 
                href="/keyword-planner"
                className="text-gray-400 hover:text-gray-600 mr-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Search Volume & Forecasts</h1>
            </div>
            <p className="text-gray-600 mt-1 ml-9">Analyze keyword performance and trends</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Get search volume and forecasts</h2>
            <button 
              onClick={() => setResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Keyword Input Area */}
          <div className="mb-6">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter or paste your keywords, one word or phrase per line, or separated by commas"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
          </div>


          {/* Upload File Option */}
          <div className="mb-8">
            <button
              onClick={() => {/* TODO: Implement file upload */}}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload a file
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Get Started Button */}
          <div className="mb-8">
            <button
              onClick={handleGetStarted}
              disabled={!isFormValid() || loading}
              className={`px-6 py-3 rounded-md font-medium text-sm ${
                isFormValid() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Getting forecasts...' : 'Get started'}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Campaign Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Campaign Forecast Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.campaign_forecast.total_impressions.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.campaign_forecast.total_clicks.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">${results.campaign_forecast.total_cost.toFixed(2)}</div>
                    <div className="text-sm text-blue-700">Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.campaign_forecast.total_conversions}</div>
                    <div className="text-sm text-blue-700">Conversions</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{(results.campaign_forecast.avg_ctr * 100).toFixed(2)}%</div>
                    <div className="text-sm text-blue-700">Avg CTR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{(results.campaign_forecast.avg_cvr * 100).toFixed(2)}%</div>
                    <div className="text-sm text-blue-700">Avg CVR</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold text-blue-600">{(results.budget_utilization * 100).toFixed(1)}%</div>
                  <div className="text-sm text-blue-700">Budget Utilization</div>
                </div>
              </div>

              {/* Keyword Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Performance Forecasts</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVR</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.keywords.map((keyword, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{keyword.keyword}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{keyword.impressions.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{keyword.clicks.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(keyword.ctr * 100).toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${keyword.cost.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{keyword.conversions}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(keyword.cvr * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="text-center text-sm text-gray-500">
                Data source: {results.source} {results.cached && '(cached)'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
