'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { getKeywordIdeas, KeywordIdeasRequest, KeywordIdeasResponse } from '@/lib/api'

export default function DiscoverKeywords() {
  const [activeTab, setActiveTab] = useState('keywords')
  const [keywordInput, setKeywordInput] = useState('')
  const [websiteInput, setWebsiteInput] = useState('')
  const [siteScope, setSiteScope] = useState('entire')
  const [filterSite, setFilterSite] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KeywordIdeasResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleGetResults = async () => {
    if (activeTab === 'keywords' && !keywordInput.trim()) {
      setError('Please enter at least one keyword or product description')
      return
    }
    
    if (activeTab === 'website') {
      if (!websiteInput.trim()) {
        setError('Please enter a website URL to discover keywords')
        return
      }
      
      // Validate URL format
      const urlToValidate = websiteInput.trim()
      if (!isValidUrl(urlToValidate)) {
        setError('Please enter a valid URL (e.g., https://example.com)')
        return
      }
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      let request: KeywordIdeasRequest

      if (activeTab === 'keywords') {
        // Keywords mode - use product description and optional filter site
        request = {
          product_description: keywordInput.trim(),
          url: filterSite.trim() || undefined,
          geo: 'US',
          language: 'en'
        }
      } else {
        // Website mode - use url_seed feature (URL only, no keywords)
        request = {
          url: websiteInput.trim(),
          geo: 'US',
          language: 'en'
        }
      }

      const response = await getKeywordIdeas(request)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get keyword ideas')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    if (activeTab === 'keywords') {
      return keywordInput.trim().length > 0
    } else {
      return websiteInput.trim().length > 0 && isValidUrl(websiteInput.trim())
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Discover New Keywords</h1>
            </div>
            <p className="text-gray-600 mt-1 ml-9">Find keyword ideas for your campaigns</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Discover new keywords</h2>
            <button 
              onClick={() => setResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'keywords'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Start with keywords
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'website'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Start with a website
            </button>
          </div>

          {/* Keywords Tab Content */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              {/* Products/Services Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter products or services closely related to your business
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder='Try "meal delivery" or "leather boots"'
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                {/* Language & Location */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    English (default)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    United States
                  </div>
                </div>

                {/* Helper Text */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Try not to be too specific or general. For example, "meal delivery" is better than "meals" for a food delivery business.
                  </p>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Learn more</a>
                </div>
              </div>

              {/* Filter Site Input */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter a site to filter unrelated keywords
                  </label>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                    placeholder="https://"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Using your site will filter out services, products, or brands that you don't offer.
                </p>
              </div>
            </div>
          )}

          {/* Website Tab Content */}
          {activeTab === 'website' && (
            <div className="space-y-6">
              {/* Website Input */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter a website or a page to find keywords that match your site
                  </label>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
                  </div>
                  <input
                    type="text"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    placeholder="https://"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      websiteInput.trim() && !isValidUrl(websiteInput.trim()) ? 'border-red-300' : 
                      !websiteInput.trim() ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {!websiteInput.trim() && (
                  <p className="mt-1 text-sm text-red-600">Enter a value</p>
                )}
                {websiteInput.trim() && !isValidUrl(websiteInput.trim()) && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid URL (e.g., https://example.com)</p>
                )}
                
                {/* Language & Location */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    English (default)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    United States
                  </div>
                </div>

                {/* Scope Options */}
                <div className="mt-4">
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scope"
                        value="entire"
                        checked={siteScope === 'entire'}
                        onChange={(e) => setSiteScope(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Use the entire site</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scope"
                        value="page"
                        checked={siteScope === 'page'}
                        onChange={(e) => setSiteScope(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Use only this page</span>
                    </label>
                  </div>
            </div>
            
                {/* Helper Text */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Use a website as a source of keywords.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Get Results Button */}
          <div className="mt-8">
            <button
              onClick={handleGetResults}
              disabled={!isFormValid() || loading}
              className={`px-6 py-3 rounded-md font-medium text-sm ${
                isFormValid() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Discovering keywords...' : 'Get results'}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Keyword Discovery Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.keywords.length}</div>
                    <div className="text-sm text-green-700">Keywords Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.source}</div>
                    <div className="text-sm text-green-700">Data Source</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.cached ? 'Yes' : 'No'}</div>
                    <div className="text-sm text-green-700">Cached</div>
            </div>
          </div>
              </div>

              {/* Keywords Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovered Keywords</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Searches</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition Index</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low CPC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High CPC</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.keywords.map((keyword, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{keyword.text}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {keyword.monthly_searches > 0 ? keyword.monthly_searches.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              keyword.competition === 'LOW' ? 'bg-green-100 text-green-800' :
                              keyword.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              keyword.competition === 'HIGH' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {keyword.competition}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {keyword.competition_index !== null ? `${keyword.competition_index}/100` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {keyword.cpc_low > 0 ? `$${keyword.cpc_low.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {keyword.cpc_high > 0 ? `$${keyword.cpc_high.toFixed(2)}` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Options */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    const csvContent = [
                      ['Keyword', 'Monthly Searches', 'Competition', 'Competition Index', 'Low CPC', 'High CPC'],
                      ...results.keywords.map(kw => [
                        kw.text,
                        kw.monthly_searches || '',
                        kw.competition,
                        kw.competition_index || '',
                        kw.cpc_low || '',
                        kw.cpc_high || ''
                      ])
                    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'discovered-keywords.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const jsonContent = JSON.stringify(results.keywords, null, 2)
                    const blob = new Blob([jsonContent], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'discovered-keywords.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                >
                  Export JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
