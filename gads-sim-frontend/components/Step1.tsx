'use client'

import { useState } from 'react'
import type { CampaignGoal, CampaignType } from '@/lib/types'

interface Step1Props {
  selectedGoal: CampaignGoal
  onGoalSelect: (goal: CampaignGoal) => void
  onNext: () => void
  selectedCampaignType?: CampaignType
  onCampaignTypeSelect?: (type: CampaignType) => void
  selectedReachMethods?: string[]
  onReachMethodsChange?: (methods: string[]) => void
  websiteUrl?: string
  onWebsiteUrlChange?: (url: string) => void
  phoneNumber?: string
  onPhoneNumberChange?: (phone: string) => void
  campaignName?: string
  onCampaignNameChange?: (name: string) => void
}

export default function Step1({ 
  selectedGoal, 
  onGoalSelect, 
  onNext, 
  selectedCampaignType: propCampaignType, 
  onCampaignTypeSelect,
  selectedReachMethods: propReachMethods = [],
  onReachMethodsChange,
  websiteUrl: propWebsiteUrl = '',
  onWebsiteUrlChange,
  phoneNumber: propPhoneNumber = '',
  onPhoneNumberChange,
  campaignName: propCampaignName = '',
  onCampaignNameChange
}: Step1Props) {
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>(propCampaignType || 'search')
  const [selectedReachMethods, setSelectedReachMethods] = useState<string[]>(propReachMethods)
  const [websiteUrl, setWebsiteUrl] = useState(propWebsiteUrl)
  const [phoneNumber, setPhoneNumber] = useState(propPhoneNumber)
  const [campaignName, setCampaignName] = useState(propCampaignName)
  const [isEditingCampaignName, setIsEditingCampaignName] = useState(false)

  // Google Ads campaign objectives matching the exact interface
  const campaignObjectives = [
    {
      value: 'sales' as CampaignGoal,
      icon: '🛍️',
      title: 'Sales',
      description: 'Drive sales online, in app, by phone, or in store',
      enabled: true,
      compatibleTypes: ['search', 'shopping', 'performance_max', 'display', 'video']
    },
    {
      value: 'leads' as CampaignGoal,
      icon: '👥',
      title: 'Leads',
      description: 'Get leads and other conversions by encouraging customers to take action',
      enabled: true,
      compatibleTypes: ['search', 'display', 'performance_max', 'video']
    },
    {
      value: 'website_traffic' as CampaignGoal,
      icon: '⭐',
      title: 'Website traffic',
      description: 'Get the right people to visit your website',
      enabled: true,
      compatibleTypes: ['search', 'display', 'video']
    },
    {
      value: 'app_promotion' as CampaignGoal,
      icon: '📱',
      title: 'App promotion',
      description: 'Get more Installs, engagement and pre-registration for your app',
      enabled: false,
      compatibleTypes: ['app', 'display', 'video'],
      disabledReason: 'Not available in this demo. Use App campaigns instead.'
    },
    {
      value: 'product_brand_consideration' as CampaignGoal,
      icon: '📢',
      title: 'Awareness and consideration',
      description: 'Reach a broad audience and build Interest in your products or brand',
      enabled: false,
      compatibleTypes: ['display', 'video', 'discovery'],
      disabledReason: 'Not available in this demo. Use Video or Display campaigns instead.'
    },
    {
      value: 'local_store_visits' as CampaignGoal,
      icon: '📍',
      title: 'Local store visits and promotions',
      description: 'Drive visits to local stores, including restaurants and dealerships',
      enabled: false,
      compatibleTypes: ['local', 'search', 'display', 'performance_max'],
      disabledReason: 'Not available in this demo. Use Performance Max or Local campaigns instead.'
    },
    {
      value: 'no_goal' as CampaignGoal,
      icon: '⚙️',
      title: 'Create a campaign without guidance',
      description: 'You\'ll choose a campaign next',
      enabled: true,
      compatibleTypes: ['search', 'display', 'shopping', 'video', 'performance_max', 'discovery', 'app', 'local']
    }
  ]

  // Filter objectives based on selected campaign type
  const filteredObjectives = campaignObjectives.map(objective => ({
    ...objective,
    enabled: objective.enabled && objective.compatibleTypes.includes(selectedCampaignType)
  }))

  // Campaign types matching Google Ads interface
  const campaignTypes = [
    {
      value: 'search' as CampaignType,
      name: 'Search',
      description: 'Generate leads on Google Search with text ads',
      icon: '🔍',
      enabled: true
    },
    {
      value: 'performance_max' as CampaignType,
      name: 'Performance Max',
      description: 'Generate leads by reaching the right people wherever they\'re browsing with ads on Google Search, YouTube, Display, and more',
      icon: '🚀',
      enabled: false,
      disabledReason: 'Not available in this demo.'
    },
    {
      value: 'display' as CampaignType,
      name: 'Demand Gen',
      description: 'Drive demand and conversions on YouTube, Google Display Network, and more with image and video ads',
      icon: '🎯',
      enabled: false,
      disabledReason: 'Not available in this demo.'
    },
    {
      value: 'video' as CampaignType,
      name: 'Video',
      description: 'Generate leads on YouTube with your video ads',
      icon: '🎥',
      enabled: false,
      disabledReason: 'Not available in this demo.'
    },
    {
      value: 'display' as CampaignType,
      name: 'Display',
      description: 'Reach potential customers across 3 million sites and apps with your creative',
      icon: '🖼️',
      enabled: false,
      disabledReason: 'Not available in this demo.'
    },
    {
      value: 'shopping' as CampaignType,
      name: 'Shopping',
      description: 'Promote your products from Merchant Center on Google Search with Shopping ads',
      icon: '🛒',
      enabled: false,
      disabledReason: 'Not available in this demo.'
    }
  ]

  // Conversion goals by objective (matching Google Ads behavior)
  const getConversionGoalsByObjective = (objective: CampaignGoal) => {
    switch (objective) {
      case 'sales':
        return [
          {
            name: 'Contacts (account default)',
            sources: [
              { name: 'Call from Ads', actions: 1 },
              { name: 'Website', actions: 1 }
            ]
          },
          {
            name: 'Phone call leads (account default)',
            sources: [
              { name: 'Call from Ads', actions: 1 }
            ]
          },
          {
            name: 'Submit lead forms (account default)',
            sources: [
              { name: 'Google hosted', actions: 1 }
            ]
          }
        ]
      
      case 'leads':
        return [
          {
            name: 'Lead submissions (account default)',
            sources: [
              { name: 'Website', actions: 1 },
              { name: 'Call from Ads', actions: 1 }
            ]
          },
          {
            name: 'Phone call leads (account default)',
            sources: [
              { name: 'Call from Ads', actions: 1 }
            ]
          },
          {
            name: 'Submit lead forms (account default)',
            sources: [
              { name: 'Google hosted', actions: 1 }
            ]
          },
          {
            name: 'Sign-ups (account default)',
            sources: [
              { name: 'Website', actions: 1 }
            ]
          }
        ]
      
      case 'website_traffic':
        return [
          {
            name: 'Page views (optional)',
            sources: [
              { name: 'Website', actions: 1 }
            ]
          },
          {
            name: 'Landing page views (optional)',
            sources: [
              { name: 'Website', actions: 1 }
            ]
          }
        ]
      
      case 'app_promotion':
        return [
          {
            name: 'App installs (account default)',
            sources: [
              { name: 'Google Play', actions: 1 }
            ]
          },
          {
            name: 'In-app actions (account default)',
            sources: [
              { name: 'Firebase', actions: 1 }
            ]
          }
        ]
      
      case 'product_brand_consideration':
        return [
          {
            name: 'Brand awareness (account default)',
            sources: [
              { name: 'Website', actions: 1 }
            ]
          },
          {
            name: 'Video views (account default)',
            sources: [
              { name: 'YouTube', actions: 1 }
            ]
          }
        ]
      
      case 'local_store_visits':
        return [
          {
            name: 'Store visits (account default)',
            sources: [
              { name: 'Google Maps', actions: 1 }
            ]
          },
          {
            name: 'Directions (account default)',
            sources: [
              { name: 'Google Maps', actions: 1 }
            ]
          }
        ]
      
      case 'no_goal':
        return [
          {
            name: 'Custom conversion 1',
            sources: [
              { name: 'Website', actions: 1 }
            ]
          },
          {
            name: 'Custom conversion 2',
            sources: [
              { name: 'Call from Ads', actions: 1 }
            ]
          }
        ]
      
      default:
        return []
    }
  }

  // Goal reach methods by objective (Search campaigns only)
  const getReachMethodsByObjective = (objective: CampaignGoal) => {
    switch (objective) {
      case 'sales':
        return [
          'Your business\'s website',
          'Phone calls'
        ]
      
      case 'leads':
        return [
          'Your business\'s website',
          'Phone calls',
          'Lead form submissions'
        ]
      
      case 'website_traffic':
        return [
          'Your business\'s website'
        ]
      
      case 'no_goal':
        return [
          'Your business\'s website',
          'Phone calls',
          'Lead form submissions (optional)'
        ]
      
      default:
        return []
    }
  }

  const handleReachMethodToggle = (method: string) => {
    setSelectedReachMethods(prev => {
      const newMethods = prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
      
      // Clear input fields when unchecking
      if (prev.includes(method)) {
        if (method === 'Your business\'s website') {
          setWebsiteUrl('')
          onWebsiteUrlChange?.('')
        } else if (method === 'Phone calls') {
          setPhoneNumber('')
          onPhoneNumberChange?.('')
        }
      }
      
      // Notify parent of change
      onReachMethodsChange?.(newMethods)
      
      return newMethods
    })
  }
  
  const handleWebsiteUrlChange = (url: string) => {
    setWebsiteUrl(url)
    onWebsiteUrlChange?.(url)
  }
  
  const handlePhoneNumberChange = (phone: string) => {
    setPhoneNumber(phone)
    onPhoneNumberChange?.(phone)
  }

  const handleCampaignNameChange = (name: string) => {
    setCampaignName(name)
    onCampaignNameChange?.(name)
  }

  const handleSaveCampaignName = () => {
    setIsEditingCampaignName(false)
    onCampaignNameChange?.(campaignName)
  }

  const handleEditCampaignName = () => {
    setIsEditingCampaignName(true)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">What's your campaign objective?</h1>
      </div>

      {/* Section 1: Choose your objective */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose your objective</h2>
        <p className="text-gray-600 mb-6">Select an objective to tailor your experience to the goals and settings that will work best for your campaign.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredObjectives.map((objective) => (
          <div
            key={objective.value}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedGoal === objective.value
                  ? 'border-blue-500 bg-blue-50'
                : objective.enabled
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => objective.enabled && onGoalSelect(objective.value)}
            >
              {/* Selection Indicator */}
              {selectedGoal === objective.value && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
              </div>
            )}

            {/* Icon */}
              <div className="text-3xl mb-3">{objective.icon}</div>

              {/* Title and Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{objective.title}</h3>
                <p className="text-xs text-gray-600">{objective.description}</p>
            </div>

              {/* Disabled Message */}
              {!objective.enabled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Not available in this demo</strong>
                  <br />
                  {objective.disabledReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Conversion Goals */}
      {selectedGoal && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Use these conversion goals to improve {selectedGoal === 'leads' ? 'Leads' : selectedGoal === 'sales' ? 'Sales' : selectedGoal === 'website_traffic' ? 'Website traffic' : selectedGoal === 'app_promotion' ? 'App promotion' : selectedGoal === 'product_brand_consideration' ? 'Brand awareness' : selectedGoal === 'local_store_visits' ? 'Local store visits' : 'your campaign'}</h2>
          <p className="text-gray-600 mb-4">
            {selectedGoal === 'website_traffic' 
              ? 'Since this objective focuses on traffic, conversion goals are optional. You can add goals manually to track specific actions.'
              : selectedGoal === 'no_goal'
              ? 'Choose from your account-level conversion actions. You have complete flexibility to select any conversion goals.'
              : 'Conversion goals labeled as account default will use data from all of your campaigns to improve your bid strategy and campaign performance, even if they don\'t seem directly related to your objective.'
            }
          </p>
          
          {getConversionGoalsByObjective(selectedGoal).length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-900">
                  <div>Conversion Goals</div>
                  <div>Conversion Source</div>
                  <div>Conversion Actions</div>
                </div>
              </div>
              
              {getConversionGoalsByObjective(selectedGoal).map((goal, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                  {goal.sources.map((source, sourceIndex) => (
                    <div key={sourceIndex} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                      <div className={sourceIndex === 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {sourceIndex === 0 ? goal.name : ''}
                      </div>
                      <div className="text-gray-600">{source.name}</div>
                      <div className="text-gray-600">▲ {source.actions} action</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">No default conversion goals available for this objective.</p>
              <p className="text-sm text-gray-500">You can add custom conversion goals manually.</p>
            </div>
          )}
          
          <div className="mt-4">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Add goal</button>
          </div>
              </div>
            )}

      {/* Section 3: Select a campaign type */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a campaign type</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {campaignTypes.map((type) => (
            <div
              key={type.value}
              className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
                selectedCampaignType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : type.enabled
                  ? 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!type.enabled) return
                const newType = type.value
                setSelectedCampaignType(newType)
                onCampaignTypeSelect?.(newType)
                // Clear selected goal if it's not compatible with new campaign type
                if (selectedGoal && !campaignObjectives.find(obj => obj.value === selectedGoal)?.compatibleTypes.includes(newType)) {
                  onGoalSelect('' as CampaignGoal)
                }
              }}
            >
            {/* Selection Indicator */}
              {selectedCampaignType === type.value && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

              {/* Icon */}
              <div className="text-2xl mb-3">{type.icon}</div>

              {/* Title and Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{type.name}</h3>
                <p className="text-xs text-gray-600">{type.description}</p>
              </div>

              {/* Disabled Message */}
              {!type.enabled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Not available in this demo</strong>
                  <br />
                  {type.disabledReason}
                </div>
              )}
            </div>
        ))}
        </div>
      </div>

      {/* Section 4: Select the ways you'd like to reach your goal */}
      {selectedGoal && getReachMethodsByObjective(selectedGoal).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select the ways you'd like to reach your goal</h2>
          
          <div className="space-y-3">
            {getReachMethodsByObjective(selectedGoal).map((method) => (
              <div key={method}>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReachMethods.includes(method)}
                    onChange={() => handleReachMethodToggle(method)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{method}</span>
                </label>
                
                {/* Website URL Input */}
                {method === 'Your business\'s website' && selectedReachMethods.includes(method) && (
                  <div className="ml-7 mt-2">
                    <input
                      type="url"
                      placeholder="Enter your website URL (e.g., https://example.com)"
                      value={websiteUrl}
                      onChange={(e) => handleWebsiteUrlChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                
                {/* Phone Number Input */}
                {method === 'Phone calls' && selectedReachMethods.includes(method) && (
                  <div className="ml-7 mt-2">
                    <input
                      type="tel"
                      placeholder="Enter your phone number (e.g., +1-555-123-4567)"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Campaign Name */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign name</h2>
        <div className="max-w-md">
          {isEditingCampaignName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCampaignName}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingCampaignName(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-900 font-medium">
                  {campaignName || 'No campaign name set'}
                </span>
                <button
                  onClick={handleEditCampaignName}
                  className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Choose a name that helps you identify this campaign in your account.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-end space-x-4">
        <button className="px-6 py-2 text-blue-600 border border-gray-300 rounded hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={!selectedGoal}
          className={`px-6 py-2 rounded font-medium ${
            selectedGoal
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
