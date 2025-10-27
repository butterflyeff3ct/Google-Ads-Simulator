'use client'

import { useState, useEffect, useRef } from 'react'

interface Step3Props {
  onNext: () => void
  onBack: () => void
}

export default function Step3({ onNext, onBack }: Step3Props) {
  // Refs for click outside detection
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  
  // Networks state
  const [searchPartnersEnabled, setSearchPartnersEnabled] = useState(true)
  const [displayNetworkEnabled, setDisplayNetworkEnabled] = useState(false)
  
  // Locations state
  const [selectedLocation, setSelectedLocation] = useState('US')
  const [locationOptionsExpanded, setLocationOptionsExpanded] = useState(false)
  const [locationPresence, setLocationPresence] = useState('presence')
  
  // Languages state
  const [selectedLanguages, setSelectedLanguages] = useState(['en'])
  const [languageSearchQuery, setLanguageSearchQuery] = useState('')
  const [languagesDropdownOpen, setLanguagesDropdownOpen] = useState(false)
  
  // EU Political Ads state
  const [euPoliticalAds, setEuPoliticalAds] = useState<'yes' | 'no' | null>(null)
  
  // Audience Segments state
  const [audienceSegmentsExpanded, setAudienceSegmentsExpanded] = useState(false)
  const [selectedAudienceSegments, setSelectedAudienceSegments] = useState<string[]>([])
  const [audienceTargetingSetting, setAudienceTargetingSetting] = useState<'observation' | 'targeting'>('observation')
  
  // More Settings state
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false)
  const [adRotation, setAdRotation] = useState('optimize')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [adSchedule, setAdSchedule] = useState('all_day')
  const [adScheduleExpanded, setAdScheduleExpanded] = useState(false)
  const [trackingTemplate, setTrackingTemplate] = useState('')
  const [customParameters, setCustomParameters] = useState('')
  const [finalUrlSuffix, setFinalUrlSuffix] = useState('')
  const [pageFeeds, setPageFeeds] = useState('')
  const [urlOptionsExpanded, setUrlOptionsExpanded] = useState(false)
  const [pageFeedsExpanded, setPageFeedsExpanded] = useState(false)

  // Available languages
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ]

  // Available audience segments
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

  // Filter languages based on search
  const filteredLanguages = availableLanguages.filter(lang =>
    lang.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
  )

  // Get selected language names
  const getSelectedLanguageNames = () => {
    return selectedLanguages.map(code => 
      availableLanguages.find(lang => lang.code === code)?.name
    ).filter(Boolean).join(', ')
  }

  // Toggle language selection
  const toggleLanguage = (languageCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageCode)
        ? prev.filter(code => code !== languageCode)
        : [...prev, languageCode]
    )
  }

  // Check if EU targeting is enabled
  const isEuTargeting = selectedLocation === 'EU' || selectedLocation === 'DE' || selectedLocation === 'FR' || selectedLocation === 'IT' || selectedLocation === 'ES'

  // Click outside detection for language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguagesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Campaign settings</h1>
        <p className="text-gray-600">
          Configure your campaign details. You can change these settings later.
        </p>
      </div>

      {/* 1. NETWORKS */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Networks</h2>
          <p className="text-sm text-gray-600 mt-1">Defines where your Search ads can appear.</p>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={searchPartnersEnabled}
              onChange={(e) => setSearchPartnersEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Google Search Partners Network</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
                <button className="text-gray-400 hover:text-gray-600 text-xs" title="Ads may appear near Google search results and on other Google partner sites relevant to your keywords">
                  ?
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Expands reach to Google partner websites where users search with Google. Examples include YouTube, Maps, and third-party sites with search boxes powered by Google.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={displayNetworkEnabled}
              onChange={(e) => setDisplayNetworkEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Google Display Network</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Allows ads to appear on YouTube, Gmail, and Display placements only if you have remaining Search budget. Used for cross-network visibility.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 2. LOCATIONS */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          <p className="text-sm text-gray-600 mt-1">Controls geographic reach for your campaign.</p>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Target locations</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="EU">All countries and territories</option>
              <option value="custom">Enter another location</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => setLocationOptionsExpanded(!locationOptionsExpanded)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <span>Location options</span>
              <span className="text-gray-400">{locationOptionsExpanded ? '∧' : '∨'}</span>
            </button>
            
            {locationOptionsExpanded && (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="locationPresence"
                      value="presence"
                      checked={locationPresence === 'presence'}
                      onChange={(e) => setLocationPresence(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Presence: People in or regularly in targeted locations</div>
                      <div className="text-xs text-gray-500">Recommended</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="locationPresence"
                      value="interest"
                      checked={locationPresence === 'interest'}
                      onChange={(e) => setLocationPresence(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Interest: People searching for your targeted locations</div>
                    </div>
                  </label>
                </div>
                
                <div className="pt-2">
                  <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
                    Exclude locations
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. LANGUAGES */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
          <p className="text-sm text-gray-600 mt-1">Defines the language preferences of your target audience.</p>
        </div>
        
        <div className="px-6 py-4">
          <div className="relative" ref={languageDropdownRef}>
            <label className="block text-sm font-medium text-gray-900 mb-2">Target languages</label>
            <div className="relative">
              <input
                type="text"
                value={languageSearchQuery}
                onChange={(e) => {
                  setLanguageSearchQuery(e.target.value)
                  setLanguagesDropdownOpen(true)
                }}
                onFocus={() => setLanguagesDropdownOpen(true)}
                placeholder="Search languages..."
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            
            {languagesDropdownOpen && (
              <div className="absolute z-10 w-full max-w-md mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredLanguages.map((language) => (
                  <div
                    key={language.code}
                    onClick={() => {
                      toggleLanguage(language.code)
                      setLanguageSearchQuery('')
                      setLanguagesDropdownOpen(false)
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-900">{language.name}</span>
                    {selectedLanguages.includes(language.code) && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedLanguages.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Selected languages:</div>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((code) => {
                  const language = availableLanguages.find(lang => lang.code === code)
                  return (
                    <div key={code} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                      {language?.name}
                      <button
                        onClick={() => toggleLanguage(code)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. EU POLITICAL ADS */}
      {isEuTargeting && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">EU Political Ads</h2>
            <p className="text-sm text-gray-600 mt-1">Required compliance section for EU targeting.</p>
          </div>
          
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Does your campaign have European Union political ads?
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="euPoliticalAds"
                      value="yes"
                      checked={euPoliticalAds === 'yes'}
                      onChange={(e) => setEuPoliticalAds(e.target.value as 'yes')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Yes, this campaign has EU political ads.</div>
                      <div className="text-xs text-gray-500">Select if ads promote political candidates, parties, or issues within the EU.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="euPoliticalAds"
                      value="no"
                      checked={euPoliticalAds === 'no'}
                      onChange={(e) => setEuPoliticalAds(e.target.value as 'no')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">No, this campaign doesn't have EU political ads.</div>
                      <div className="text-xs text-gray-500">Select if not applicable.</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
                  Learn how an EU political ad is defined.
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIENCE SEGMENTS */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button 
          className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50"
          onClick={() => setAudienceSegmentsExpanded(!audienceSegmentsExpanded)}
        >
          <h2 className="text-lg font-semibold text-gray-900">Audience segments</h2>
          <span className="text-gray-400 text-xl">
            {audienceSegmentsExpanded ? '∧' : '∨'}
          </span>
        </button>
        
        {audienceSegmentsExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 mt-4">
              Optional targeting layer that allows adding audience groups for observation or targeting.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Panel - Audience Selection */}
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder='Try "lights & fixtures"'
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-gray-50 rounded border border-gray-200 max-h-80 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {availableAudienceSegments.map((segment) => (
                      <label
                        key={segment.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAudienceSegments.includes(segment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAudienceSegments([...selectedAudienceSegments, segment.id])
                            } else {
                              setSelectedAudienceSegments(selectedAudienceSegments.filter(id => id !== segment.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {segment.name}
                            <button className="text-gray-400 hover:text-gray-600 text-xs">?</button>
                          </div>
                          <div className="text-xs text-gray-500">{segment.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <span className="text-lg">+</span>
                  <span>New segment</span>
                </button>
              </div>

              {/* Right Panel - Selected Segments */}
              <div className="bg-gray-50 rounded border border-gray-200 p-4 self-start">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-medium text-gray-700">
                    {selectedAudienceSegments.length === 0 ? 'None selected' : `${selectedAudienceSegments.length} selected`}
                  </div>
                  {selectedAudienceSegments.length > 0 && (
                    <button
                      onClick={() => setSelectedAudienceSegments([])}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {selectedAudienceSegments.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Select one or more segments to target.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAudienceSegments.map((segmentId) => {
                      const segment = availableAudienceSegments.find(s => s.id === segmentId)
                      return segment ? (
                        <div
                          key={segmentId}
                          className="flex items-center justify-between px-3 py-2 bg-white rounded text-sm border border-gray-200"
                        >
                          <span className="text-gray-900">{segment.name}</span>
                          <button
                            onClick={() => setSelectedAudienceSegments(selectedAudienceSegments.filter(id => id !== segmentId))}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Targeting Setting */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-sm font-medium text-gray-900">Targeting setting for this campaign</h4>
                <button className="text-gray-400 hover:text-gray-600 text-xs" title="Choose how audience segments affect your campaign">?</button>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceTargeting"
                    checked={audienceTargetingSetting === 'observation'}
                    onChange={() => setAudienceTargetingSetting('observation')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Observation (recommended)</div>
                    <div className="text-xs text-gray-500">
                      Tracks performance data but does not restrict reach.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceTargeting"
                    checked={audienceTargetingSetting === 'targeting'}
                    onChange={() => setAudienceTargetingSetting('targeting')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Targeting</div>
                    <div className="text-xs text-gray-500">
                      Restricts campaign to the selected audience only.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. MORE SETTINGS */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button 
          className="w-full flex items-center gap-2 px-6 py-4 text-left text-blue-600 hover:text-blue-700 hover:bg-gray-50"
          onClick={() => setMoreSettingsExpanded(!moreSettingsExpanded)}
        >
          <span className="text-lg">⚙️</span>
          <span className="font-medium">More settings</span>
          <span className="text-gray-400 ml-auto">{moreSettingsExpanded ? '∧' : '∨'}</span>
        </button>
        
        {moreSettingsExpanded && (
          <div className="divide-y divide-gray-200">
            {/* Ad Rotation */}
            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">Ad rotation</div>
              <select
                value={adRotation}
                onChange={(e) => setAdRotation(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="optimize">Optimize: Prefer best performing ads</option>
                <option value="rotate">Do not optimize: Rotate ads indefinitely</option>
              </select>
            </div>
            
            {/* Start and End Dates */}
            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">Start and end dates</div>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Start date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">End date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Not set"
                  />
                </div>
              </div>
            </div>
            
            {/* Ad Schedule */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setAdScheduleExpanded(!adScheduleExpanded)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 text-left"
              >
                <div className="text-sm font-medium text-gray-900">Ad schedule</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {adSchedule === 'all_day' ? 'All day' : 
                     adSchedule === 'weekdays' ? 'Weekdays 9 AM - 6 PM' :
                     adSchedule === 'weekends' ? 'Weekends only' :
                     adSchedule === 'business_hours' ? 'Business hours (9 AM - 5 PM)' :
                     adSchedule === 'evenings' ? 'Evenings (6 PM - 11 PM)' :
                     'Custom schedule'}
                  </span>
                  <span className="text-gray-400">{adScheduleExpanded ? '∧' : '∨'}</span>
                </div>
              </button>
              
              {adScheduleExpanded && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Schedule type</label>
                      <select
                        value={adSchedule}
                        onChange={(e) => setAdSchedule(e.target.value)}
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all_day">All day</option>
                        <option value="weekdays">Weekdays 9 AM - 6 PM</option>
                        <option value="weekends">Weekends only</option>
                        <option value="business_hours">Business hours (9 AM - 5 PM)</option>
                        <option value="evenings">Evenings (6 PM - 11 PM)</option>
                        <option value="custom">Custom schedule</option>
                      </select>
                    </div>
                    
                    {adSchedule === 'custom' && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-900">Custom schedule</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <select className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              <option value="all_days">All days</option>
                              <option value="mondays_fridays">Mondays - Fridays</option>
                              <option value="saturdays_sundays">Saturdays - Sundays</option>
                              <option value="mondays">Mondays</option>
                              <option value="tuesdays">Tuesdays</option>
                              <option value="wednesdays">Wednesdays</option>
                              <option value="thursdays">Thursdays</option>
                              <option value="fridays">Fridays</option>
                              <option value="saturdays">Saturdays</option>
                              <option value="sundays">Sundays</option>
                            </select>
                            <input
                              type="time"
                              defaultValue="09:00"
                              className="w-32 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                              type="time"
                              defaultValue="17:00"
                              className="w-32 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          + Add schedule
                        </button>
                        <div className="text-xs text-gray-500">
                          Timezone: (GMT-04:00) Eastern Time
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Campaign URL Options */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setUrlOptionsExpanded(!urlOptionsExpanded)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 text-left"
              >
                <div className="text-sm font-medium text-gray-900">Campaign URL options</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {trackingTemplate || customParameters || finalUrlSuffix ? 'Configured' : 'No options set'}
                  </span>
                  <span className="text-gray-400">{urlOptionsExpanded ? '∧' : '∨'}</span>
                </div>
              </button>
              
              {urlOptionsExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tracking template</label>
                    <input
                      type="text"
                      value={trackingTemplate}
                      onChange={(e) => setTrackingTemplate(e.target.value)}
                      placeholder="{lpurl}?utm_source=google&utm_medium=cpc"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Custom parameters</label>
                    <input
                      type="text"
                      value={customParameters}
                      onChange={(e) => setCustomParameters(e.target.value)}
                      placeholder="utm_content=ad1"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Final URL suffix</label>
                    <input
                      type="text"
                      value={finalUrlSuffix}
                      onChange={(e) => setFinalUrlSuffix(e.target.value)}
                      placeholder="source=google&medium=cpc"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Page Feeds */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setPageFeedsExpanded(!pageFeedsExpanded)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 text-left"
              >
                <div className="text-sm font-medium text-gray-900">Page feeds</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {pageFeeds ? 'Feed configured' : 'No feeds added'}
                  </span>
                  <span className="text-gray-400">{pageFeedsExpanded ? '∧' : '∨'}</span>
                </div>
              </button>
              
              {pageFeedsExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Add page feeds to your campaign</label>
                    <input
                      type="text"
                      value={pageFeeds}
                      onChange={(e) => setPageFeeds(e.target.value)}
                      placeholder="Enter feed URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enables Dynamic Search Ads (DSA) by providing URL feeds Google can use for matching queries.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-end space-x-4">
        <button 
          onClick={onBack}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back
        </button>
        <button 
          onClick={onNext}
          disabled={isEuTargeting && !euPoliticalAds}
          className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
