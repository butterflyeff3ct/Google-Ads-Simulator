'use client'

import { useState } from 'react'
import { getKeywordIdeas } from '@/lib/api'
import type { AdGroup, Keyword, NegativeKeyword, KeywordIdea } from '@/lib/types'
import AdPreview from './AdPreview'
import LeadFormModal from './LeadFormModal'

interface Step6Props {
  adGroups: AdGroup[]
  onUpdateAdGroups: (adGroups: AdGroup[]) => void
  onNext: () => void
  onBack: () => void
  campaignObjective?: 'sales' | 'leads' | 'website_traffic' | 'manual'
  selectedReachMethods?: string[]
  phoneNumber?: string
}

export default function Step6({ adGroups, onUpdateAdGroups, onNext, onBack, campaignObjective = 'website_traffic', selectedReachMethods = [], phoneNumber = '' }: Step6Props) {
  const [showLeadFormModal, setShowLeadFormModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    keywords: true,
    ads: true,
    adGroupSettings: false
  })
  const [keywords, setKeywords] = useState('')
  const [finalUrl, setFinalUrl] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordIdea[]>([])
  const [adGroupName, setAdGroupName] = useState('Ad group 1')
  const [isEditingAdGroupName, setIsEditingAdGroupName] = useState(false)
  const [tempAdGroupName, setTempAdGroupName] = useState('Ad group 1')

  const handleLeadFormSave = (formData: any) => {
    console.log('Lead form saved:', formData)
  }

  const handleEditAdGroupName = () => {
    setTempAdGroupName(adGroupName)
    setIsEditingAdGroupName(true)
  }

  const handleSaveAdGroupName = () => {
    setAdGroupName(tempAdGroupName)
    setIsEditingAdGroupName(false)
  }

  const handleCancelEditAdGroupName = () => {
    setTempAdGroupName(adGroupName)
    setIsEditingAdGroupName(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAdGroupName()
    } else if (e.key === 'Escape') {
      handleCancelEditAdGroupName()
    }
  }

  const parseKeywords = (keywordsText: string): Keyword[] => {
    if (!keywordsText.trim()) return []
    
    // Split by newlines and commas, then clean up
    const keywordLines = keywordsText
      .split(/[\n,]/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    return keywordLines.map(text => {
      // Determine match type based on brackets/quotes
      let matchType: 'exact' | 'phrase' | 'broad' = 'broad'
      let cleanText = text
      
      if (text.startsWith('[') && text.endsWith(']')) {
        matchType = 'exact'
        cleanText = text.slice(1, -1)
      } else if (text.startsWith("'") && text.endsWith("'")) {
        matchType = 'phrase'
        cleanText = text.slice(1, -1)
      }
      
      return {
        text: cleanText,
        match_type: matchType,
        quality_score: 7 // Default quality score
      }
    })
  }

  const handleNext = () => {
    // Parse keywords and save to the first ad group
    const parsedKeywords = parseKeywords(keywords)
    
    if (parsedKeywords.length > 0 && adGroups.length > 0) {
      const updatedAdGroups = [...adGroups]
      updatedAdGroups[0] = {
        ...updatedAdGroups[0],
        keywords: parsedKeywords
      }
      onUpdateAdGroups(updatedAdGroups)
    }
    
    onNext()
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleGetKeywordSuggestions = async () => {
    if (!finalUrl && !productDescription) return

    setIsGeneratingKeywords(true)
    try {
      // Parse comma-separated keywords from product description
      const keywordSeeds = productDescription
        ? productDescription.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : []

      // Determine API method based on inputs
      let apiMethod = ''
      if (finalUrl && keywordSeeds.length > 0) {
        apiMethod = 'keyword_and_url_seed'
      } else if (finalUrl) {
        apiMethod = 'url_seed'
      } else if (keywordSeeds.length > 0) {
        apiMethod = 'keyword_seed'
      }

      console.log('Using API method:', apiMethod)
      console.log('Request parameters:', { url: finalUrl, product_description: productDescription })

      const request = {
        url: finalUrl && finalUrl.trim() ? finalUrl.trim() : undefined,
        product_description: productDescription && productDescription.trim() ? productDescription.trim() : undefined,
        geo: 'US',
        language: 'en'
      }

      console.log('Sending request:', request)

      const response = await getKeywordIdeas(request)
      setKeywordSuggestions(response.keywords || [])

      // Auto-populate the keywords textarea with suggestions
      if (response.keywords && response.keywords.length > 0) {
        const suggestedKeywords = response.keywords.map((s: any) => s.text).join('\n')
        setKeywords(suggestedKeywords) // Replace existing keywords instead of appending
      }
    } catch (error) {
      console.error('Error generating keywords:', error)
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const getHeaderText = () => {
    switch (campaignObjective) {
      case 'sales':
        return 'Create ads to increase sales'
      case 'leads':
        return 'Create ads to get more leads'
      case 'website_traffic':
        return 'Create ads to get more website traffic'
      case 'manual':
        return 'Create ads'
      default:
        return 'Create ads to get more website traffic'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditingAdGroupName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempAdGroupName}
                  onChange={(e) => setTempAdGroupName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1 py-0.5"
                  autoFocus
                />
                <button
                  onClick={handleSaveAdGroupName}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelEditAdGroupName}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{adGroupName}</h1>
                <button 
                  onClick={handleEditAdGroupName}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit ad group name"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">&lt; 1 of 2 &gt;</span>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Ad groups help you organize your ads around a common theme. For the best results, focus your ads and keywords on one product or service.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Keywords Section */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('keywords')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <h2 className="text-lg font-medium text-gray-900">Add details to match your ads to the right searches</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.keywords ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.keywords && (
            <div className="px-6 pb-6 space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Keywords</h3>

                {/* Get Keyword Suggestions */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Get keyword suggestions (optional)</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Google Ads can find keywords for you by scanning a web page or seeing what's working for similar products or services.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    💡 <strong>Tip:</strong> Separate multiple products or services with commas (e.g., "running shoes, fitness equipment, workout gear")
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Final URL</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={finalUrl}
                          onChange={(e) => setFinalUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter products or services to advertise</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          placeholder="e.g., running shoes, fitness equipment, workout gear"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGetKeywordSuggestions}
                    disabled={isGeneratingKeywords || (!finalUrl && !productDescription)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingKeywords ? 'Getting suggestions...' : 'Get keyword suggestions'}
                  </button>
                </div>

                {/* Enter Keywords */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Enter keywords</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Keywords are words or phrases that are used to match your ads with the terms people are searching for.
                  </p>
                  <textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter or paste keywords. You can separate each keyword by commas or enter one per line."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Match types help control which searches can trigger your ads.</span>
                    <br />
                    keyword - Broad match | 'keyword' - Phrase match | [keyword] - Exact match
                    <a href="#" className="text-blue-600 hover:text-blue-700 ml-1">Learn more</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ad Group Settings Section */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('adGroupSettings')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-gray-900">Ad group settings for AI Max</h2>
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">BETA</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Turn on AI Max in your campaign to use these ad group level settings</p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.adGroupSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.adGroupSettings && (
            <div className="px-6 pb-6 space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-800">Turn on AI Max in your campaign to use these ad group level settings</span>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                  Go to AI Max
                </button>
              </div>

              {/* Search Term Matching */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-medium text-gray-900">Search term matching</h3>
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">BETA</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Search term matching expands your keywords to broad match and lets Google AI match content from your landing pages and assets to help you show up on more relevant searches.
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <input type="checkbox" id="searchTermMatching" className="rounded border-gray-300" />
                  <label htmlFor="searchTermMatching" className="text-sm text-gray-700">Use search term matching for this ad group</label>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-800">Turn on AI Max in your campaign to use search term matching</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                    Go to AI Max
                  </button>
                </div>
              </div>

              {/* Brand Inclusions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium text-gray-900 mb-3">Brand inclusions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add brand inclusions to limit traffic to serve only on search queries related to the specified brands. Your ad group brand inclusions will be used instead of campaign-level brand inclusions.
                  <svg className="w-4 h-4 text-gray-400 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </p>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Add brand lists"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-800">Turn on AI Max in your campaign to add brand inclusions</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                    Go to AI Max
                  </button>
                </div>
              </div>

              {/* Locations of Interest */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium text-gray-900 mb-3">Locations of interest</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use locations of interest to reach customers searching for or interested in specific geographic areas. The locations you selected in your campaign settings still apply. For best results, use locations of interest with phrase and broad match keywords.
                  <svg className="w-4 h-4 text-gray-400 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </p>
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Add locations of interest"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mb-4">For example, a country, city, region, or postal code</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-800">Turn on AI Max in your campaign to add locations of interest</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                    Go to AI Max
                  </button>
                </div>
              </div>

              {/* URL Inclusions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium text-gray-900 mb-3">URL inclusions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Google AI selects the best performing landing page from your website. To use only certain pages, create URL rules or choose custom labels from your page feeds.
                </p>
                <p className="text-sm text-gray-700 mb-4">Add URL inclusions</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-800">Turn on asset optimization in AI Max to add URL inclusions</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                    Go to AI Max
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ads Section */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('ads')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <h2 className="text-lg font-medium text-gray-900">{getHeaderText()}</h2>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.ads ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.ads && (
            <div className="px-6 pb-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Ads</h3>
              <AdPreview
                campaignObjective={campaignObjective}
                selectedReachMethods={selectedReachMethods}
                phoneNumber={phoneNumber}
                onOpenLeadForm={() => setShowLeadFormModal(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Step 6 of 9</span>
          <button
            onClick={handleNext}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Next
          </button>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={showLeadFormModal}
        onClose={() => setShowLeadFormModal(false)}
        onSave={handleLeadFormSave}
      />
    </div>
  )
}