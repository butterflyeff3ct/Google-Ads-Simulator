'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { runSimulation } from '@/lib/api'
import { CampaignConfigManager, CampaignConfigStorage, CampaignConfig } from '@/lib/campaign-config'
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
  const [configManager] = useState(() => new CampaignConfigManager())

  // Legacy state for backward compatibility (will be removed in Phase 2)
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

  // Step 4: Bidding Strategy
  const [bidding, setBidding] = useState<BiddingConfig>({
    strategy: 'manual_cpc',
    target_cpa: 25,
    target_roas: 400,
    max_cpc: 2.5,
    impression_share_target: 65,
    impression_share_location: 'anywhere'
  })

  // Step 5: Campaign Settings
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    daily_budget: 100,
    currency: 'USD',
    geo_targeting: ['US'],
    language_targeting: ['en'],
    device_targeting: ['desktop', 'mobile'],
    ad_schedule: 'all_day',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    ad_rotation: 'optimize'
  })

  // Step 6: Ad Groups
  const [adGroups, setAdGroups] = useState<AdGroup[]>([
    {
      id: '1',
      name: 'Ad group 1',
      type: 'standard',
      keywords: [],
      ads: [],
      default_bid: 1.5,
      final_url: '',
      negative_keywords: []
    }
  ])

  // Step 7: Responsive Search Ads
  const [ads, setAds] = useState<ResponsiveSearchAd[]>([
    {
      id: '1',
      ad_group_id: '1',
      headlines: [
        { text: '', pinned: false },
        { text: '', pinned: false },
        { text: '', pinned: false }
      ],
      descriptions: [
        { text: '', pinned: false },
        { text: '', pinned: false }
      ],
      final_url: '',
      path1: '',
      path2: '',
      status: 'enabled'
    }
  ])

  // Step 8: Ad Assets
  const [assets, setAssets] = useState<AdAssets>({
    sitelinks: [],
    callouts: [],
    structured_snippets: [],
    call_extensions: [],
    location_extensions: [],
    app_extensions: []
  })

  // Step 9: Simulation Settings
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    geo: 'US',
    language: 'en',
    num_auctions: 1000,
    base_cvr: 0.03,
    pacing_type: 'standard'
  })

  // Load saved configuration on component mount
  useEffect(() => {
    const savedConfig = CampaignConfigStorage.loadConfig()
    if (savedConfig) {
      configManager.importFromJSON(JSON.stringify(savedConfig))
      
      // Update legacy state for backward compatibility
      const config = configManager.getConfig()
      setSelectedGoal(config.campaign.goal as CampaignGoal)
      setSelectedCampaignType(config.campaign.type as CampaignType)
      setSelectedReachMethods(config.campaign.reach_methods)
      setWebsiteUrl(config.campaign.website_url || '')
      setPhoneNumber(config.campaign.phone_number || '')
      setCampaignName(config.campaign.name)
      
      // Update other state from config
      if (config.budget.daily_budget) {
        setCampaignSettings(prev => ({ ...prev, daily_budget: config.budget.daily_budget! }))
      }
      
      if (config.keywords.parsed_keywords.length > 0) {
        setAdGroups(prev => prev.map(ag => ({
          ...ag,
          keywords: config.keywords.parsed_keywords.map(kw => ({
            text: kw.text,
            match_type: kw.match_type,
            bid: kw.bid || 1.5,
            quality_score: kw.quality_score || 7
          }))
        })))
      }
    }
  }, [configManager])

  // Auto-save configuration on changes
  useEffect(() => {
    const config = configManager.getConfig()
    CampaignConfigStorage.saveConfig(config)
  }, [configManager, selectedGoal, selectedCampaignType, selectedReachMethods, websiteUrl, phoneNumber, campaignName])

  // Step 1 handlers
  const handleStep1Next = () => {
    // Update config with Step 1 data
    configManager.updateConfig({
      campaign: {
        name: campaignName,
        goal: selectedGoal,
        type: selectedCampaignType,
        reach_methods: selectedReachMethods,
        website_url: websiteUrl,
        phone_number: phoneNumber
      }
    })
    setStep(2)
  }

  // Step 2 handlers
  const handleStep2Next = () => {
    // Update config with Step 2 data
    configManager.updateConfig({
      bidding: {
        strategy: bidding.strategy as any,
        focus: 'clicks', // Default focus
        max_cpc_enabled: bidding.strategy === 'manual_cpc',
        max_cpc_value: bidding.max_cpc,
        target_cpa_enabled: bidding.strategy === 'target_cpa',
        target_cpa_value: bidding.target_cpa,
        target_roas_value: bidding.target_roas,
        impression_share_location: bidding.impression_share_location as any,
        impression_share_percent: bidding.impression_share_target,
        bid_for_new_customers_only: false
      }
    })
    setStep(3)
  }

  // Step 3 handlers
  const handleStep3Next = () => {
    // Update config with Step 3 data
    configManager.updateConfig({
      settings: {
        networks: {
          search_partners_enabled: true,
          display_network_enabled: false
        },
        locations: {
          selected_location: campaignSettings.geo_targeting[0] || 'US',
          location_presence: 'presence'
        },
        languages: {
          selected_languages: campaignSettings.language_targeting
        },
        audience_segments: {
          selected_segments: [],
          targeting_setting: 'observation'
        },
        advanced: {
          ad_rotation: campaignSettings.ad_rotation as any,
          start_date: campaignSettings.start_date,
          end_date: campaignSettings.end_date,
          ad_schedule: campaignSettings.ad_schedule as any
        }
      }
    })
    setStep(4)
  }

  // Step 4 handlers
  const handleStep4Next = () => {
    setStep(5)
  }

  // Step 5 handlers
  const handleStep5Next = (data: { productDescription: string; adGroups: any[] }) => {
    // Update config with Step 5 data
    configManager.updateConfig({
      content: {
        final_url: '', // Will be updated from Step 5
        product_description: data.productDescription,
        ad_groups: data.adGroups
      }
    })
    setStep(6)
  }

  const handleStep5Skip = () => {
    setStep(6)
  }

  // Step 6 handlers
  const handleStep6Next = () => {
    // Parse keywords from Step 6
    const rawKeywords = adGroups[0]?.keywords?.map(k => {
      let text = k.text
      let matchType = k.match_type
      
      // Parse match type from brackets/quotes
      if (text.startsWith('[') && text.endsWith(']')) {
        matchType = 'exact'
        text = text.slice(1, -1)
      } else if (text.startsWith("'") && text.endsWith("'")) {
        matchType = 'phrase'
        text = text.slice(1, -1)
      }
      
      return {
        text,
        match_type: matchType,
        bid: k.bid,
        quality_score: k.quality_score
      }
    }) || []

    // Update config with Step 6 data
    configManager.updateConfig({
      keywords: {
        raw_keywords: rawKeywords.map(k => k.text).join('\n'),
        parsed_keywords: rawKeywords,
        keyword_suggestions: [],
        ad_group_name: adGroups[0]?.name || 'Ad group 1'
      }
    })
    setStep(7)
  }

  // Step 7 handlers
  const handleStep7Next = () => {
    // Update config with Step 7 data
    configManager.updateConfig({
      budget: {
        type: 'daily',
        daily_budget: campaignSettings.daily_budget,
        currency: campaignSettings.currency
      }
    })
    setStep(8)
  }

  // Step 8 handlers
  const handleStep8Next = () => {
    // Update config with final settings
    configManager.updateConfig({
      simulation: {
        geo: simulationSettings.geo,
        language: simulationSettings.language,
        num_auctions: simulationSettings.num_auctions,
        base_cvr: simulationSettings.base_cvr,
        pacing_type: simulationSettings.pacing_type,
        seed: 12345,
        debug: false
      }
    })
    setStep(9)
  }

  // Step 9 handlers
  const handleStep9Next = () => {
    setStep(10)
  }

  // Final submission
  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Validate configuration
      const validation = configManager.validateConfig()
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }

      // Convert to simulation request
      const simulationRequest = configManager.toSimulationRequest()
      
      // Run simulation
      const result = await runSimulation(simulationRequest)
      
      // Store results
      localStorage.setItem(`sim_${result.run_id}`, JSON.stringify(result))
      
      // Navigate to results
      router.push(`/results/${result.run_id}`)
      
    } catch (err: any) {
      setError(err.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  // Export configuration
  const handleExportConfig = () => {
    const config = configManager.getConfig()
    CampaignConfigStorage.exportConfig(config)
  }

  // Clear configuration
  const handleClearConfig = () => {
    CampaignConfigStorage.clearConfig()
    configManager.updateConfig({})
    
    // Reset all state
    setSelectedGoal('sales')
    setSelectedCampaignType('search')
    setSelectedReachMethods([])
    setWebsiteUrl('')
    setPhoneNumber('')
    setCampaignName('')
    setStep(1)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1
            selectedGoal={selectedGoal}
            onGoalSelect={setSelectedGoal}
            onNext={handleStep1Next}
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
          />
        )
      case 2:
        return (
          <Step2
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )
      case 3:
        return (
          <Step3
            onNext={handleStep3Next}
            onBack={() => setStep(2)}
          />
        )
      case 4:
        return (
          <AIMaxStep
            onNext={handleStep4Next}
            onBack={() => setStep(3)}
            onSkip={() => setStep(5)}
          />
        )
      case 5:
        return (
          <Step5
            onNext={handleStep5Next}
            onBack={() => setStep(4)}
            onSkip={handleStep5Skip}
          />
        )
      case 6:
        return (
          <Step6
            adGroups={adGroups}
            onUpdateAdGroups={setAdGroups}
            onNext={handleStep6Next}
            onBack={() => setStep(5)}
            campaignObjective={selectedGoal}
            selectedReachMethods={selectedReachMethods}
            phoneNumber={phoneNumber}
          />
        )
      case 7:
        return (
          <Step7
            onNext={handleStep7Next}
            onBack={() => setStep(6)}
          />
        )
      case 8:
        return (
          <Step8
            onNext={handleStep8Next}
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
            keywords={adGroups.flatMap(ag => ag.keywords)}
            ads={ads}
          />
        )
      case 9:
        return (
          <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">Configuration Summary</h1>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Campaign Configuration</h2>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(configManager.getConfig(), null, 2)}
                </pre>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleExportConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Export Configuration
                </button>
                <button
                  onClick={handleClearConfig}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Clear Configuration
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setStep(8)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleStep9Next}
                className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue to Simulation
              </button>
            </div>
          </div>
        )
      case 10:
        return (
          <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">Run Simulation</h1>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Your campaign configuration has been saved and is ready for simulation. 
                  Click "Run Simulation" to start the enhanced simulation engine.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Enhanced Simulation Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Deterministic results based on your actual campaign inputs</li>
                    <li>• Quality Score calculation from ad relevance and landing page</li>
                    <li>• Match type impact on CTR and auction participation</li>
                    <li>• Location and device targeting modifiers</li>
                    <li>• Campaign objective-driven conversion modeling</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(9)}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Running Simulation...' : 'Run Simulation'}
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Create New Campaign</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Step {step} of 10</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{Math.round((step / 10) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {renderStep()}
      </div>
    </div>
  )
}
