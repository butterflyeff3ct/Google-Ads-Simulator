'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { runSimulation } from '@/lib/api'
import AIMaxStep from '@/components/AIMaxStep'
import Step1 from '@/components/Step1'
import Step2 from '@/components/Step2'
import Step3 from '@/components/Step3'
import Step4 from '@/components/Step4'
import Step5 from '@/components/Step5'
import Step6 from '@/components/Step6'
import Step7 from '@/components/Step7'
import Step8 from '@/components/Step8'
import type {
  CampaignGoal,
  CampaignType,
  ConversionGoal,
  BiddingConfig,
  CampaignSettings,
  AdGroup,
  ResponsiveSearchAd,
  AdAssets,
  FullCampaign,
  Keyword,
  NegativeKeyword,
  SimulationSettings
} from '@/lib/types'

export default function NewCampaign() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Campaign Goal and Type
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal>('sales')
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>('search')
  const [selectedReachMethods, setSelectedReachMethods] = useState<string[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [campaignName, setCampaignName] = useState('')

  // Step 3: Conversion Goals
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([
    { id: '1', name: 'Submit lead form', type: 'website_visits', is_primary: true },
    { id: '2', name: 'Sign-ups', type: 'website_visits', is_primary: false }
  ])

  // Conversion goals by objective
  const conversionGoalsByObjective: Record<string, Array<{
    id: string
    name: string
    accountDefault: boolean
    icon: string
    sources: Array<{ name: string; actions: number }>
  }>> = {
    'sales': [
      {
        id: 'contacts',
        name: 'Contacts',
        accountDefault: true,
        icon: '\ud83d\udc65',
        sources: [
          { name: 'Call from Ads', actions: 1 },
          { name: 'Website', actions: 1 }
        ]
      },
      {
        id: 'phone_calls',
        name: 'Phone call leads',
        accountDefault: true,
        icon: '\ud83d\udcde',
        sources: [
          { name: 'Call from Ads', actions: 1 }
        ]
      },
      {
        id: 'lead_forms',
        name: 'Submit lead forms',
        accountDefault: true,
        icon: '\ud83d\udcdd',
        sources: [
          { name: 'Google hosted', actions: 1 }
        ]
      }
    ],
    'leads': [
      {
        id: 'lead_submissions',
        name: 'Lead submissions',
        accountDefault: true,
        icon: '\ud83d\udcdd',
        sources: [
          { name: 'Website', actions: 1 },
          { name: 'Google hosted', actions: 1 }
        ]
      },
      {
        id: 'phone_calls',
        name: 'Phone call leads',
        accountDefault: true,
        icon: '\ud83d\udcde',
        sources: [
          { name: 'Call from Ads', actions: 1 }
        ]
      },
      {
        id: 'signups',
        name: 'Sign-ups',
        accountDefault: false,
        icon: '\u270d\ufe0f',
        sources: [
          { name: 'Website', actions: 1 }
        ]
      }
    ],
    'website_traffic': [],
    'no_goal': []
  }

  // Step 4: Bidding
  const [bidding, setBidding] = useState<BiddingConfig>({
    strategy: 'manual_cpc',
    focus: 'conversions'
  })
  const [targetCPA, setTargetCPA] = useState<number | ''>(25)
  const [targetROAS, setTargetROAS] = useState<number | ''>(400)
  const [maxCPC, setMaxCPC] = useState<number | ''>(2.5)
  const [enableTargetCPA, setEnableTargetCPA] = useState(false)
  const [enableTargetROAS, setEnableTargetROAS] = useState(false)
  const [enableMaxCPCLimit, setEnableMaxCPCLimit] = useState(false)

  // Step 5: Campaign Settings
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    name: '',
    networks: { search: true, display: false },
    locations: [{ name: 'United States', type: 'country', code: 'US' }],
    location_target: 'presence',
    excluded_locations: [],
    languages: ['en'],
    audience_segments: [],
    daily_budget: 10
  })

  // Step 6: Ad Groups (moved above effects to avoid TDZ issues)
  const [adGroups, setAdGroups] = useState<AdGroup[]>([
    {
      id: '1',
      name: 'Ad Group 1',
      type: 'standard',
      default_bid: 1.5,
      keywords: [{ text: '', match_type: 'phrase', quality_score: 7 }],
      negative_keywords: []
    }
  ])

  // Step 7: Ads (moved above effects to avoid TDZ issues)
  const [ads, setAds] = useState<ResponsiveSearchAd[]>([
    {
      id: '1',
      final_url: '',
      headlines: [
        { text: '' },
        { text: '' },
        { text: '' }
      ],
      descriptions: [
        { text: '' },
        { text: '' }
      ]
    }
  ])

  // Persist wizard state to localStorage on change; hydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('campaign_wizard')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSelectedGoal(parsed.selectedGoal ?? 'sales')
        setSelectedCampaignType(parsed.selectedCampaignType ?? 'search')
        setSelectedReachMethods(parsed.selectedReachMethods ?? [])
        setWebsiteUrl(parsed.websiteUrl ?? '')
        setPhoneNumber(parsed.phoneNumber ?? '')
        setCampaignName(parsed.campaignName ?? '')
        setCampaignSettings(parsed.campaignSettings ?? { ...campaignSettings })
        setAdGroups(parsed.adGroups ?? adGroups)
        setAds(parsed.ads ?? ads)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const snapshot = {
        selectedGoal,
        selectedCampaignType,
        selectedReachMethods,
        websiteUrl,
        phoneNumber,
        campaignName,
        campaignSettings,
        adGroups,
        ads
      }
      localStorage.setItem('campaign_wizard', JSON.stringify(snapshot))
    } catch {}
  }, [
    selectedGoal,
    selectedCampaignType,
    selectedReachMethods,
    websiteUrl,
    phoneNumber,
    campaignName,
    campaignSettings,
    adGroups,
    ads
  ])

  

  // Step 8: Assets
  const [assets, setAssets] = useState<AdAssets>({
    sitelinks: [],
    callouts: [],
    structured_snippets: []
  })

  // Simulation settings
  const [simSettings, setSimSettings] = useState<SimulationSettings>({
    geo: 'US',
    language: 'en',
    num_auctions: 10000,
    base_cvr: 0.03,
    pacing_type: 'standard'
  })

  // More settings state
  const [moreSettings, setMoreSettings] = useState({
    adRotation: 'optimize',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    urlOptions: '',
    pageFeeds: ''
  })
  const [editingMoreSetting, setEditingMoreSetting] = useState<string | null>(null)

  // Audience segments state
  const [selectedAudienceSegments, setSelectedAudienceSegments] = useState<string[]>([])
  const [audienceSearchTab, setAudienceSearchTab] = useState<'search' | 'browse'>('search')
  const [audienceSearchQuery, setAudienceSearchQuery] = useState('')
  const [audienceTargetingSetting, setAudienceTargetingSetting] = useState<'targeting' | 'observation'>('targeting')
  const [showAudienceSegments, setShowAudienceSegments] = useState(true)

  // Predefined audience segments
  const availableAudienceSegments = [
    { id: 'electrician_services', name: 'Electrician Services', description: 'Based on advertisers like you' },
    { id: 'business_services', name: 'Business Services', description: 'Based on advertisers like you' },
    { id: 'lights_fixtures', name: 'Lights & Fixtures', description: 'Based on advertisers like you' },
    { id: 'computers_peripherals', name: 'Computers & Peripherals', description: 'Based on advertisers like you' },
    { id: 'home_automation', name: 'Home Automation Enthusiasts', description: 'Based on advertisers like you' },
    { id: 'smart_home_tech', name: 'Smart Home Technology', description: 'Based on advertisers like you' },
    { id: 'diy_home_improvement', name: 'DIY Home Improvement', description: 'Based on advertisers like you' },
    { id: 'commercial_contractors', name: 'Commercial Contractors', description: 'Based on advertisers like you' },
    { id: 'residential_contractors', name: 'Residential Contractors', description: 'Based on advertisers like you' },
    { id: 'energy_efficiency', name: 'Energy Efficiency Seekers', description: 'Based on advertisers like you' }
  ]

  // Filter segments based on search
  const filteredAudienceSegments = availableAudienceSegments.filter(segment =>
    audienceSearchQuery === '' ||
    segment.name.toLowerCase().includes(audienceSearchQuery.toLowerCase())
  )

  // Ad schedule state
  const [adSchedules, setAdSchedules] = useState<Array<{
    id: string
    dayType: string
    startTime: string
    endTime: string
  }>>([
    { id: '1', dayType: 'all_days', startTime: '00:00', endTime: '00:00' }
  ])

  // AI Max state
  const [aiMaxEnabled, setAiMaxEnabled] = useState(true)
  const [textCustomization, setTextCustomization] = useState(true)
  const [finalUrlExpansion, setFinalUrlExpansion] = useState(true)
  const [brandInclusions, setBrandInclusions] = useState<string[]>([])
  const [brandExclusions, setBrandExclusions] = useState<string[]>([])
  const [showAssetOptimization, setShowAssetOptimization] = useState(false)
  const [showBrands, setShowBrands] = useState(false)

  // Keyword and Asset Generation state
  const [keywordGenerationUrl, setKeywordGenerationUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [productDescription, setProductDescription] = useState('')
  const [generatedAdGroups, setGeneratedAdGroups] = useState<any[]>([])

  // Helper function to validate URL
  const isValidUrl = (url: string) => {
    try {
      const urlPattern = /^https?:\/\/.+/i
      return urlPattern.test(url)
    } catch {
      return false
    }
  }

  // Helper function to simulate keyword generation
  const generateKeywordsAndAssets = async () => {
    setIsGenerating(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setHasGenerated(true)
    console.log('AI Generated keywords and assets for URL:', keywordGenerationUrl)
  }

  // Ways to reach goal mapping

  const waysToReachGoal: Record<CampaignGoal, Array<{ id: string; label: string; icon: string }>> = {
    'sales': [
      { id: 'website', label: 'Your business\'s website', icon: '🌐' },
      { id: 'phone_calls', label: 'Phone calls', icon: '📞' },
      { id: 'store_visits', label: 'Store visits', icon: '🏪' },
      { id: 'app_downloads', label: 'App downloads', icon: '📱' }
    ],
    'leads': [
      { id: 'website', label: 'Your business\'s website', icon: '🌐' },
      { id: 'phone_calls', label: 'Phone calls', icon: '📞' },
      { id: 'lead_form', label: 'Lead form submissions', icon: '📝' },
      { id: 'app_downloads', label: 'App downloads', icon: '📱' }
    ],
    'website_traffic': [
      { id: 'website', label: 'Your business\'s website', icon: '🌐' }
    ],
    'product_brand_consideration': [],
    'brand_awareness_reach': [],
    'app_promotion': [],
    'local_store_visits': [
      { id: 'store_visits', label: 'Store visits', icon: '🏪' },
      { id: 'phone_calls', label: 'Phone calls', icon: '📞' }
    ],
    'no_goal': [
      { id: 'website', label: 'Your business\'s website', icon: '🌐' },
      { id: 'phone_calls', label: 'Phone calls', icon: '📞' },
      { id: 'app', label: 'App', icon: '📱' },
      { id: 'store_visits', label: 'Store visits', icon: '🏪' }
    ]
  }

  const goalOptions = [
    { value: 'sales', label: 'Sales', icon: '💰', desc: 'Drive sales online, in app, by phone, or in store.', enabled: true },
    { value: 'leads', label: 'Leads', icon: '🎯', desc: 'Get leads and other conversions by encouraging customers to take action.', enabled: true },
    { value: 'website_traffic', label: 'Website traffic', icon: '🌐', desc: 'Get the right people to visit your website.', enabled: true },
    { value: 'product_brand_consideration', label: 'Awareness and consideration', icon: '⭐', desc: 'Reach a broad audience and build interest.', enabled: false },
    { value: 'brand_awareness_reach', label: 'Local store visits and promotions', icon: '🏪', desc: 'Drive visits to local stores.', enabled: false },
    { value: 'app_promotion', label: 'App promotion', icon: '📱', desc: 'Get more installs, engagement, and pre-registrations for your app.', enabled: false },
    { value: 'no_goal', label: 'Create a campaign without a goal\'s guidance', icon: '⚙️', desc: 'Advanced users.', enabled: true }
  ]

  const campaignTypes = [
    { value: 'search', label: 'Search', icon: '🔍', desc: 'Generate leads on Google Search with text ads.' },
    { value: 'performance_max', label: 'Performance Max', icon: '⚡', desc: 'Reach the right people across all of Google\'s channels.' },
    { value: 'demand_gen', label: 'Demand Gen', icon: '✨', desc: 'Generate demand and conversions on YouTube, Google Discover, and Gmail.' },
    { value: 'display', label: 'Display', icon: '🖼️', desc: 'Reach potential customers across the web with your creative.' },
    { value: 'video', label: 'Video', icon: '🎬', desc: 'Reach potential customers on YouTube with your video ads.' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️', desc: 'Promote your products from your online store on Google.' }
  ]

  const biddingStrategies = [
    { value: 'manual_cpc', label: 'Manual CPC', desc: 'Set your own maximum cost-per-click bids' },
    { value: 'maximize_conversions', label: 'Maximize conversions', desc: 'Get the most conversions within your budget' },
    { value: 'maximize_conversion_value', label: 'Maximize conversion value', desc: 'Get the most conversion value within your budget' },
    { value: 'maximize_clicks', label: 'Maximize clicks', desc: 'Get the most clicks within your budget' },
    { value: 'target_impression_share', label: 'Target impression share', desc: 'Show your ads in a target location' }
  ]

  // Add ad group
  const addAdGroup = () => {
    setAdGroups([
      ...adGroups,
      {
        id: Date.now().toString(),
        name: `Ad Group ${adGroups.length + 1}`,
        type: 'standard',
        default_bid: 1.5,
        keywords: [{ text: '', match_type: 'phrase', quality_score: 7 }],
        negative_keywords: []
      }
    ])
  }

  // Update ad group
  const updateAdGroup = (index: number, field: keyof AdGroup, value: any) => {
    const updated = [...adGroups]
    updated[index] = { ...updated[index], [field]: value }
    setAdGroups(updated)
  }

  // Add keyword to ad group
  const addKeywordToGroup = (groupIndex: number) => {
    const updated = [...adGroups]
    updated[groupIndex].keywords.push({ text: '', match_type: 'phrase', quality_score: 7 })
    setAdGroups(updated)
  }

  // Update keyword in ad group
  const updateKeyword = (groupIndex: number, kwIndex: number, field: keyof Keyword, value: any) => {
    const updated = [...adGroups]
    updated[groupIndex].keywords[kwIndex] = {
      ...updated[groupIndex].keywords[kwIndex],
      [field]: value
    }
    setAdGroups(updated)
  }

  // Remove keyword
  const removeKeyword = (groupIndex: number, kwIndex: number) => {
    const updated = [...adGroups]
    updated[groupIndex].keywords = updated[groupIndex].keywords.filter((_, i) => i !== kwIndex)
    setAdGroups(updated)
  }

  // Add headline
  const addHeadline = (adIndex: number) => {
    if (ads[adIndex].headlines.length >= 15) return
    const updated = [...ads]
    updated[adIndex].headlines.push({ text: '' })
    setAds(updated)
  }

  // Update headline
  const updateHeadline = (adIndex: number, hIndex: number, text: string) => {
    const updated = [...ads]
    updated[adIndex].headlines[hIndex].text = text
    setAds(updated)
  }

  // Remove headline
  const removeHeadline = (adIndex: number, hIndex: number) => {
    if (ads[adIndex].headlines.length <= 3) return
    const updated = [...ads]
    updated[adIndex].headlines = updated[adIndex].headlines.filter((_, i) => i !== hIndex)
    setAds(updated)
  }

  // Add description
  const addDescription = (adIndex: number) => {
    if (ads[adIndex].descriptions.length >= 4) return
    const updated = [...ads]
    updated[adIndex].descriptions.push({ text: '' })
    setAds(updated)
  }

  // Update description
  const updateDescription = (adIndex: number, dIndex: number, text: string) => {
    const updated = [...ads]
    updated[adIndex].descriptions[dIndex].text = text
    setAds(updated)
  }

  // Remove description
  const removeDescription = (adIndex: number, dIndex: number) => {
    if (ads[adIndex].descriptions.length <= 2) return
    const updated = [...ads]
    updated[adIndex].descriptions = updated[adIndex].descriptions.filter((_, i) => i !== dIndex)
    setAds(updated)
  }

  // Add sitelink
  const addSitelink = () => {
    setAssets({
      ...assets,
      sitelinks: [...assets.sitelinks, { link_text: '', url: '' }]
    })
  }

  // Update sitelink
  const updateSitelink = (index: number, field: keyof typeof assets.sitelinks[0], value: string) => {
    const updated = [...assets.sitelinks]
    updated[index] = { ...updated[index], [field]: value }
    setAssets({ ...assets, sitelinks: updated })
  }

  // Remove sitelink
  const removeSitelink = (index: number) => {
    setAssets({
      ...assets,
      sitelinks: assets.sitelinks.filter((_, i) => i !== index)
    })
  }

  // Add callout
  const addCallout = () => {
    setAssets({
      ...assets,
      callouts: [...assets.callouts, { text: '' }]
    })
  }

  // Update callout
  const updateCallout = (index: number, text: string) => {
    const updated = [...assets.callouts]
    updated[index].text = text
    setAssets({ ...assets, callouts: updated })
  }

  // Remove callout
  const removeCallout = (index: number) => {
    setAssets({
      ...assets,
      callouts: assets.callouts.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Validate
      if (!campaignName) {
        throw new Error('Campaign name is required')
      }

      // Collect all keywords from all ad groups
      const allKeywords = adGroups.flatMap(group =>
        group.keywords
          .filter(k => k.text.trim())
          .map(k => ({
            ...k,
            bid: k.bid || group.default_bid || 1.5
          }))
      )

      if (allKeywords.length === 0) {
        throw new Error('At least one keyword is required')
      }

      // Generate a unique seed based on configuration hash
      const configString = JSON.stringify({
        campaign: campaignName,
        keywords: allKeywords.map(k => k.text).sort(),
        budget: campaignSettings.daily_budget,
        timestamp: Date.now()  // Ensures each run is unique
      })
      
      // Simple hash function to convert config to seed
      let hash = 0
      for (let i = 0; i < configString.length; i++) {
        hash = ((hash << 5) - hash) + configString.charCodeAt(i)
        hash = hash & hash  // Convert to 32-bit integer
      }
      const uniqueSeed = Math.abs(hash) % 2147483647

      // Convert to API format
      const result = await runSimulation({
        campaign: {
          name: campaignName,
          type: 'search',
          daily_budget: campaignSettings.daily_budget,
          bidding_strategy: bidding.strategy
        },
        keywords: allKeywords,
        settings: simSettings,
        seed: uniqueSeed,
        debug: false
      })

      // Store results with campaign data
      const resultsWithCampaign = {
        ...result,
        campaign: {
          name: campaignName,
          type: 'search',
          daily_budget: campaignSettings.daily_budget,
          bidding_strategy: bidding.strategy
        }
      }
      localStorage.setItem(`sim_${result.run_id}`, JSON.stringify(resultsWithCampaign))

      // Navigate to results
      router.push(`/results/${result.run_id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation')
      setLoading(false)
    }
  }

  const steps = [
    '1. Search',
    '2. Bidding',
    '3. Campaign settings',
    '4. AI Max',
    '5. Keyword and asset generation',
    '6. Ad groups',
    '7. Budget',
    '8. Review'
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Left Sidebar - Campaign Setup Progress */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <div className="text-xl font-bold text-gray-900 mb-6">Campaign Setup</div>
          <div className="space-y-3">
            {steps.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${step === idx + 1
                    ? 'bg-blue-600 text-white'
                    : step > idx + 1
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Choose Goal */}
          {step === 1 && (
            <Step1
              selectedGoal={selectedGoal}
              onGoalSelect={setSelectedGoal}
              selectedCampaignType={selectedCampaignType}
              onCampaignTypeSelect={setSelectedCampaignType}
              selectedReachMethods={selectedReachMethods}
              onReachMethodsChange={setSelectedReachMethods}
              websiteUrl={websiteUrl}
              onWebsiteUrlChange={setWebsiteUrl}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              campaignName={campaignName}
              onCampaignNameChange={setCampaignName}
              onNext={() => setStep(2)}
            />
          )}

          {/* Step 2: Bidding */}
          {step === 2 && (
            <Step2
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {/* Step 3: Campaign Settings */}
          {step === 3 && (
            <Step3
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {/* Step 4: AI Max */}
          {step === 4 && (
            <Step4
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}

          {/* Step 5: Keyword and Asset Generation */}
          {step === 5 && (
            <Step5
              onNext={(data) => {
                // Store the generated data
                setProductDescription(data.productDescription)
                setGeneratedAdGroups(data.adGroups)

                // Update ad groups if we have generated ones
                if (data.adGroups.length > 0) {
                  setAdGroups(data.adGroups.map((group, index) => ({
                    id: Date.now().toString() + index,
                    name: group.name,
                    type: 'standard',
                    default_bid: 1.5,
                    keywords: [],
                    negative_keywords: []
                  })))
                }

                setStep(6)
              }}
              onBack={() => setStep(4)}
              onSkip={() => setStep(6)}
            />
          )}

          {/* Step 6: Ad Groups */}
          {step === 6 && (
            <Step6
              adGroups={adGroups}
              onUpdateAdGroups={setAdGroups}
              campaignObjective={selectedGoal as 'sales' | 'leads' | 'website_traffic' | 'manual'}
              selectedReachMethods={selectedReachMethods}
              phoneNumber={phoneNumber}
              onNext={() => setStep(7)}
              onBack={() => setStep(5)}
            />
          )}

          {/* Step 7: Budget */}
          {step === 7 && (
            <Step7
              onNext={() => setStep(8)}
              onBack={() => setStep(6)}
              initialDailyBudget={campaignSettings.daily_budget}
              onUpdateDailyBudget={(val) => setCampaignSettings(prev => ({ ...prev, daily_budget: val }))}
            />
          )}

          {/* Step 8: Review */}
          {step === 8 && (
            <Step8
              onNext={handleSubmit}
              onBack={() => setStep(7)}
              campaignName={campaignName}
              selectedGoal={selectedGoal}
              selectedCampaignType={selectedCampaignType}
              selectedReachMethods={selectedReachMethods}
              websiteUrl={websiteUrl}
              phoneNumber={phoneNumber}
              dailyBudget={campaignSettings.daily_budget}
              biddingStrategy={bidding.strategy}
              adGroups={adGroups}
              keywords={adGroups.flatMap(g => g.keywords)}
              ads={ads}
            />
          )}

        </div>
      </div>
    </div>
  )
}
