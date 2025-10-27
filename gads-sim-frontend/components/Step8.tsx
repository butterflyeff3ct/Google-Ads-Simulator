'use client'

import { useEffect, useState } from 'react'

interface Step8Props {
  onNext: () => void
  onBack: () => void
  campaignName?: string
  selectedGoal?: string
  selectedCampaignType?: string
  selectedReachMethods?: string[]
  websiteUrl?: string
  phoneNumber?: string
  dailyBudget?: number
  biddingStrategy?: string
  adGroups?: any[]
  keywords?: any[]
  ads?: any[]
}

export default function Step8({ 
  onNext, 
  onBack,
  campaignName = '',
  selectedGoal = 'sales',
  selectedCampaignType = 'search',
  selectedReachMethods = [],
  websiteUrl = '',
  phoneNumber = '',
  dailyBudget = 100,
  biddingStrategy = 'target_cpa',
  adGroups = [],
  keywords = [],
  ads = []
}: Step8Props) {
  const [expandedSections, setExpandedSections] = useState({
    campaign: true,
    adGroups: true,
    keywords: true,
    ads: true,
    budget: true
  })

  // Persist a complete snapshot of the user's inputs for the Review step
  useEffect(() => {
    try {
      const reviewSnapshot = {
        campaign: {
          name: campaignName,
          goal: selectedGoal,
          type: selectedCampaignType,
          reach_methods: selectedReachMethods,
          website_url: websiteUrl,
          phone_number: phoneNumber
        },
        budget_bidding: {
          daily_budget: dailyBudget,
          bidding_strategy: biddingStrategy
        },
        ad_groups: adGroups,
        keywords: keywords,
        ads: ads,
        saved_at: new Date().toISOString()
      }
      // Store under a consistent key for later steps to read
      localStorage.setItem('campaign_review_current', JSON.stringify(reviewSnapshot))
    } catch {}
  }, [
    campaignName,
    selectedGoal,
    selectedCampaignType,
    selectedReachMethods,
    websiteUrl,
    phoneNumber,
    dailyBudget,
    biddingStrategy,
    adGroups,
    keywords,
    ads
  ])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getGoalDisplayName = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      'sales': 'Sales',
      'leads': 'Leads', 
      'website_traffic': 'Website traffic',
      'manual': 'Manual'
    }
    return goalMap[goal] || goal
  }

  const getCampaignTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'search': 'Search',
      'display': 'Display',
      'shopping': 'Shopping',
      'video': 'Video',
      'performance_max': 'Performance Max',
      'demand_gen': 'Demand Gen'
    }
    return typeMap[type] || type
  }

  const getBiddingStrategyDisplayName = (strategy: string) => {
    const strategyMap: { [key: string]: string } = {
      'target_cpa': 'Target CPA',
      'target_roas': 'Target ROAS',
      'max_cpc': 'Max CPC',
      'maximize_clicks': 'Maximize Clicks',
      'maximize_conversions': 'Maximize Conversions'
    }
    return strategyMap[strategy] || strategy
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Review your campaign</h1>
            <p className="text-sm text-gray-600 mt-1">
              Review all your campaign settings before creating your campaign.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Campaign Settings */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('campaign')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Campaign settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                {campaignName || 'Untitled campaign'} • {getGoalDisplayName(selectedGoal)} • {getCampaignTypeDisplayName(selectedCampaignType)}
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.campaign ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.campaign && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign name</label>
                    <p className="text-sm text-gray-900">{campaignName || 'Untitled campaign'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign goal</label>
                    <p className="text-sm text-gray-900">{getGoalDisplayName(selectedGoal)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign type</label>
                    <p className="text-sm text-gray-900">{getCampaignTypeDisplayName(selectedCampaignType)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reach methods</label>
                    <p className="text-sm text-gray-900">
                      {selectedReachMethods.length > 0 ? selectedReachMethods.join(', ') : 'None selected'}
                    </p>
                  </div>
                  {websiteUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                      <p className="text-sm text-blue-600">{websiteUrl}</p>
                    </div>
                  )}
                  {phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                      <p className="text-sm text-gray-900">{phoneNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budget & Bidding */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('budget')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Budget & bidding</h2>
              <p className="text-sm text-gray-600 mt-1">
                ${dailyBudget} daily budget • {getBiddingStrategyDisplayName(biddingStrategy)}
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.budget ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.budget && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily budget</label>
                    <p className="text-sm text-gray-900">${dailyBudget}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bidding strategy</label>
                    <p className="text-sm text-gray-900">{getBiddingStrategyDisplayName(biddingStrategy)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated monthly spend</label>
                    <p className="text-sm text-gray-900">${(dailyBudget * 30).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <p className="text-sm text-gray-900">USD</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ad Groups */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('adGroups')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Ad groups</h2>
              <p className="text-sm text-gray-600 mt-1">
                {adGroups.length} ad group{adGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.adGroups ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.adGroups && (
            <div className="px-6 pb-6">
              {adGroups.length > 0 ? (
                <div className="space-y-3">
                  {adGroups.map((group, index) => (
                    <div key={group.id || index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600">
                            {group.keywords?.length || 0} keywords
                            {group.default_bid && ` • Default bid: $${group.default_bid}`}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {group.type || 'Standard'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No ad groups created</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keywords */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('keywords')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Keywords</h2>
              <p className="text-sm text-gray-600 mt-1">
                {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.keywords ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.keywords && (
            <div className="px-6 pb-6">
              {keywords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {keywords.slice(0, 20).map((keyword, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">
                        {typeof keyword === 'string' ? keyword : (keyword.text || 'Untitled keyword')}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {typeof keyword === 'string' ? 'broad' : (keyword.match_type || 'broad')}
                      </span>
                    </div>
                  ))}
                  {keywords.length > 20 && (
                    <div className="col-span-2 text-center py-2 text-sm text-gray-500">
                      And {keywords.length - 20} more keywords...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No keywords added</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ads */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('ads')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Ads</h2>
              <p className="text-sm text-gray-600 mt-1">
                {ads.length} ad{ads.length !== 1 ? 's' : ''}
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.ads ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.ads && (
            <div className="px-6 pb-6">
              {ads.length > 0 ? (
                <div className="space-y-4">
                  {ads.map((ad, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900">Responsive Search Ad</h3>
                        <p className="text-sm text-gray-600">{ad.final_url || 'No final URL set'}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Headlines</label>
                          <p className="text-sm text-gray-900">
                            {ad.headlines?.filter((h: any) => h.text).map((h: any) => h.text).join(' | ') || 'No headlines'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Descriptions</label>
                          <p className="text-sm text-gray-900">
                            {ad.descriptions?.filter((d: any) => d.text).map((d: any) => d.text).join(' | ') || 'No descriptions'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No ads created</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Ready to create your campaign</h3>
              <p className="text-sm text-blue-800 mb-3">
                Your campaign is ready to go live. Once created, it will start running according to your budget and targeting settings.
              </p>
              <div className="text-xs text-blue-700">
                <p>• Campaign will be created with the settings shown above</p>
                <p>• Ads will start running once approved by Google</p>
                <p>• You can edit settings anytime after creation</p>
              </div>
            </div>
          </div>
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
          <span className="text-sm text-gray-500">Step 8 of 9</span>
          <button
            onClick={onNext}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Run simulation
          </button>
        </div>
      </div>
    </div>
  )
}
