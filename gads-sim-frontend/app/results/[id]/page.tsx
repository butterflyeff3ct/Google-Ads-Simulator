'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Results() {
  const params = useParams()
  const runId = params.id as string
  
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState(['clicks', 'impressions', 'cost', 'cpc'])
  const [dateRange, setDateRange] = useState('Custom')
  const [selectedClicksMetric, setSelectedClicksMetric] = useState('clicks')
  const [selectedImpressionsMetric, setSelectedImpressionsMetric] = useState('impressions')
  const [selectedCpcMetric, setSelectedCpcMetric] = useState('avg_cpc')
  const [selectedCostMetric, setSelectedCostMetric] = useState('cost')

  useEffect(() => {
    const storedResults = localStorage.getItem(`sim_${runId}`)
    
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults)
      console.log('Stored results:', parsedResults) // Debug log
      console.log('Campaign name:', parsedResults.campaign?.name) // Debug log
      setResults(parsedResults)
      setLoading(false)
    } else {
      setError('Results not found. Please run a simulation first.')
      setLoading(false)
    }
  }, [runId])

  // Use deterministic daily trend data from backend
  const trendData = useMemo(() => {
    if (!results) return []
    
    // Use backend-provided daily trends if available, otherwise generate deterministic data
    if (results.daily_trends && results.daily_trends.length > 0) {
      // Use values as-is to keep axis and tooltip consistent
      return results.daily_trends.map((day: any) => ({
        ...day
      }))
    }
    
    // Fallback: generate deterministic data based on simulation seed
    const days = 30
    const data = []
    const baseClicks = results.metrics.clicks / days
    const baseImpressions = results.metrics.impressions / days
    const baseCost = results.metrics.cost / days
    const seed = results.seed || 12345
    
    // Simple deterministic pseudo-random using seed
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000
      return x - Math.floor(x)
    }
    
    for (let i = 0; i < days; i++) {
      const variance = 0.3 // 30% variance
      const deterministicFactor = 1 + (seededRandom(i) - 0.5) * variance
      
      data.push({
        date: `Day ${i + 1}`,
        clicks: Math.round(baseClicks * deterministicFactor),
        impressions: Math.round(baseImpressions * deterministicFactor),
        cost: parseFloat((baseCost * deterministicFactor).toFixed(2)),
        cpc: parseFloat((results.metrics.avg_cpc * (0.9 + seededRandom(i + 100) * 0.2)).toFixed(2))
      })
    }
    
    return data
  }, [results])

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== metric))
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric])
    }
  }

  // Custom tooltip formatter to show original impression values
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.dataKey === 'cost' || entry.dataKey === 'cpc' ? '$' : ''}${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const downloadCSV = () => {
    if (!results) return
    
    const headers = ['Keyword', 'Match Type', 'Impressions', 'Clicks', 'CTR', 'Avg Position', 'Avg CPC', 'Cost', 'Conversions', 'CVR']
    const rows = results.by_keyword?.map((kw: any) => [
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign-results-${runId}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center border">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h2>
            <p className="text-gray-600 mb-8">{error || 'Unable to load simulation results.'}</p>
            <Link
              href="/campaign/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create New Campaign
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { metrics, by_keyword } = results

  return (
    <div className="min-h-screen bg-white">
      <div className="px-[20%] py-6">
        {/* Campaign Name and Date Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-normal text-gray-900">
            {results.campaign?.name || results.campaignName || 'Campaign Name'}
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Custom</span>
              <select 
                className="border rounded px-3 py-1.5 text-sm bg-white"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option>Sep 20 – Oct 31, 2024</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
              
              {/* Navigation Arrows */}
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Download Icon */}
            <button 
              onClick={downloadCSV}
              className="p-2 hover:bg-gray-100 rounded"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Feedback Icon */}
            <button className="p-2 hover:bg-gray-100 rounded" title="Feedback">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-4 gap-0 mb-6">
          {/* Clicks - Blue */}
          <div 
            className={`bg-blue-500 text-white p-6 cursor-pointer transition-opacity ${
              selectedMetrics.includes('clicks') ? 'opacity-100' : 'opacity-75'
            }`}
            onClick={() => toggleMetric('clicks')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <select 
                  value={selectedClicksMetric}
                  onChange={(e) => setSelectedClicksMetric(e.target.value)}
                  className="bg-transparent text-white text-sm font-normal border-none outline-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="clicks" className="text-gray-900">Clicks</option>
                  <option value="interactions" className="text-gray-900">Interactions</option>
                  <option value="phone_calls" className="text-gray-900">Phone calls</option>
                  <option value="website_visits" className="text-gray-900">Website visits</option>
                  <option value="lead_forms" className="text-gray-900">Lead form opens/submissions</option>
                </select>
              </div>
            </div>
            <div className="text-4xl font-bold">
              {selectedClicksMetric === 'clicks' && metrics.clicks.toLocaleString()}
              {selectedClicksMetric === 'interactions' && (metrics.clicks + Math.floor(metrics.clicks * 0.1)).toLocaleString()}
              {selectedClicksMetric === 'phone_calls' && Math.floor(metrics.clicks * 0.05).toLocaleString()}
              {selectedClicksMetric === 'website_visits' && Math.floor(metrics.clicks * 0.95).toLocaleString()}
              {selectedClicksMetric === 'lead_forms' && Math.floor(metrics.clicks * 0.02).toLocaleString()}
            </div>
          </div>

          {/* Impressions - Red */}
          <div 
            className={`bg-red-500 text-white p-6 cursor-pointer transition-opacity ${
              selectedMetrics.includes('impressions') ? 'opacity-100' : 'opacity-75'
            }`}
            onClick={() => toggleMetric('impressions')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <select 
                  value={selectedImpressionsMetric}
                  onChange={(e) => setSelectedImpressionsMetric(e.target.value)}
                  className="bg-transparent text-white text-sm font-normal border-none outline-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="impressions" className="text-gray-900">Impressions</option>
                  <option value="absolute_top" className="text-gray-900">Absolute top impression rate</option>
                  <option value="top_impression" className="text-gray-900">Top impression rate</option>
                  <option value="search_top_is" className="text-gray-900">Search (Top) IS</option>
                  <option value="search_abs_top_is" className="text-gray-900">Search (Abs. Top) IS</option>
                </select>
              </div>
            </div>
            <div className="text-4xl font-bold">
              {selectedImpressionsMetric === 'impressions' && (
                metrics.impressions >= 1000 
                  ? `${(metrics.impressions / 1000).toFixed(1)}K` 
                  : metrics.impressions.toLocaleString()
              )}
              {selectedImpressionsMetric === 'absolute_top' && `${(((results.seed || 12345) % 200) / 10 + 10).toFixed(1)}%`}
              {selectedImpressionsMetric === 'top_impression' && `${(((results.seed || 12345) % 300) / 10 + 20).toFixed(1)}%`}
              {selectedImpressionsMetric === 'search_top_is' && `${(((results.seed || 12345) % 150) / 10 + 5).toFixed(1)}%`}
              {selectedImpressionsMetric === 'search_abs_top_is' && `${(((results.seed || 12345) % 100) / 10 + 2).toFixed(1)}%`}
            </div>
          </div>

          {/* Avg. CPC - Yellow/Orange */}
          <div 
            className={`bg-yellow-500 text-white p-6 cursor-pointer transition-opacity ${
              selectedMetrics.includes('cpc') ? 'opacity-100' : 'opacity-75'
            }`}
            onClick={() => toggleMetric('cpc')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <select 
                  value={selectedCpcMetric}
                  onChange={(e) => setSelectedCpcMetric(e.target.value)}
                  className="bg-transparent text-white text-sm font-normal border-none outline-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="avg_cpc" className="text-gray-900">Avg. CPC</option>
                  <option value="avg_cpm" className="text-gray-900">Avg. CPM</option>
                  <option value="cost_per_conv" className="text-gray-900">Cost / conv.</option>
                  <option value="roas" className="text-gray-900">ROAS</option>
                </select>
              </div>
            </div>
            <div className="text-4xl font-bold">
              {selectedCpcMetric === 'avg_cpc' && `$${metrics.avg_cpc.toFixed(2)}`}
              {selectedCpcMetric === 'avg_cpm' && `$${(metrics.avg_cpc * 100).toFixed(2)}`}
              {selectedCpcMetric === 'cost_per_conv' && `$${(metrics.cost / metrics.conversions).toFixed(2)}`}
              {selectedCpcMetric === 'roas' && `${(metrics.roas || (((results.seed || 12345) % 300) / 100 + 1)).toFixed(2)}x`}
            </div>
          </div>

          {/* Cost - Green */}
          <div 
            className={`bg-green-600 text-white p-6 cursor-pointer transition-opacity ${
              selectedMetrics.includes('cost') ? 'opacity-100' : 'opacity-75'
            }`}
            onClick={() => toggleMetric('cost')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-normal flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cost
              </span>
            </div>
            <div className="text-4xl font-bold">${metrics.cost.toFixed(2)}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Performance Trends (Simulated Daily Data)
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Metrics
              </button>
              <button className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Adjust
              </button>
              <button className="p-1.5 hover:bg-gray-50 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <Tooltip 
                content={customTooltip}
              />
              <Legend />
              
              {selectedMetrics.includes('clicks') && (
                <Line 
                  type="linear" 
                  dataKey="clicks" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Clicks"
                />
              )}
              
              {selectedMetrics.includes('impressions') && (
                <Line 
                  type="linear" 
                  dataKey="impressions" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Impressions"
                />
              )}
              
              {selectedMetrics.includes('cost') && (
                <Line 
                  type="linear" 
                  dataKey="cost" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Cost ($)"
                />
              )}
              
              {selectedMetrics.includes('cpc') && (
                <Line 
                  type="linear" 
                  dataKey="cpc" 
                  stroke="#eab308" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Avg. CPC ($)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Summary */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">CTR</div>
              <div className="text-2xl font-semibold text-gray-900">
                {(metrics.ctr * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Conversions</div>
              <div className="text-2xl font-semibold text-gray-900">
                {metrics.conversions}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Conv. Rate</div>
              <div className="text-2xl font-semibold text-gray-900">
                {(metrics.cvr * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg. Position</div>
              <div className="text-2xl font-semibold text-gray-900">
                {metrics.avg_position?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Keyword Performance Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">Keyword Performance</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. CPC
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conv.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {by_keyword && by_keyword.length > 0 ? by_keyword.map((kw: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {kw.text || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {kw.match_type || 'phrase'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {(kw.impressions || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {(kw.clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {((kw.ctr || 0) * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${kw.avg_cpc || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ${kw.cost || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {kw.conversions || 0}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No keyword data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
