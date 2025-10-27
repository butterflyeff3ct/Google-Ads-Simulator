'use client'

import React, { useState, useEffect } from 'react'
import AdPreviewCarousel from './AdPreviewCarousel'
import { AdPreviewData } from './types'

interface AdPreviewProps {
  campaignObjective?: 'sales' | 'leads' | 'website_traffic' | 'manual'
  selectedReachMethods?: string[]
  phoneNumber?: string
  onOpenLeadForm?: () => void
}

export default function AdPreview({
  campaignObjective = 'website_traffic',
  selectedReachMethods = [],
  phoneNumber: propPhoneNumber = '',
  onOpenLeadForm
}: AdPreviewProps) {
  const [previewTab, setPreviewTab] = useState<'mobile' | 'desktop'>('mobile')

  // Ad input states
  const [finalUrl, setFinalUrl] = useState('')
  const [displayPath1, setDisplayPath1] = useState('')
  const [displayPath2, setDisplayPath2] = useState('')
  const [headlines, setHeadlines] = useState<string[]>(['', '', ''])
  const [descriptions, setDescriptions] = useState<string[]>(['', ''])
  const [phoneNumber, setPhoneNumber] = useState(propPhoneNumber)
  const [enableCalls, setEnableCalls] = useState(selectedReachMethods.includes('Phone calls'))
  const [enableLeadForm, setEnableLeadForm] = useState(selectedReachMethods.includes('Lead form submissions'))

  // Sitelinks
  const [sitelinks, setSitelinks] = useState<{ text: string; url: string }[]>([])

  // Callouts
  const [callouts, setCallouts] = useState<string[]>([])

  // Structured snippets
  const [structuredSnippets, setStructuredSnippets] = useState<{ header: string; values: string[] }[]>([])

  // Images
  const [images, setImages] = useState<{ url: string; alt: string }[]>([])

  // Business name
  const [businessName, setBusinessName] = useState('')

  // Logo
  const [logo, setLogo] = useState<{ url: string; alt: string } | null>(null)

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    finalUrl: true,
    displayPath: true,
    headlines: true,
    descriptions: true,
    images: false,
    businessName: false,
    logo: false,
    calls: false,
    leadForms: false,
    sitelinks: false,
    callouts: false,
    structuredSnippets: false,
    location: false,
    price: false,
    promotion: false
  })

  // Calculate ad strength
  const calculateAdStrength = () => {
    let score = 0
    let maxScore = 100

    // Final URL (required)
    if (finalUrl) score += 10

    // Headlines (up to 15)
    const filledHeadlines = headlines.filter(h => h.trim().length > 0)
    score += Math.min(filledHeadlines.length * 5, 40) // Max 40 points for 8+ headlines

    // Descriptions (up to 4)
    const filledDescriptions = descriptions.filter(d => d.trim().length > 0)
    score += Math.min(filledDescriptions.length * 10, 30) // Max 30 points for 3+ descriptions

    // Keywords in headlines (bonus)
    const hasKeywords = filledHeadlines.some(h => h.length > 10)
    if (hasKeywords) score += 10

    // Unique headlines
    const uniqueHeadlines = new Set(filledHeadlines.map(h => h.toLowerCase()))
    if (uniqueHeadlines.size === filledHeadlines.length && filledHeadlines.length >= 3) score += 10

    const percentage = Math.min((score / maxScore) * 100, 100)

    if (percentage < 25) return { label: 'Poor', percentage, color: 'red' }
    if (percentage < 50) return { label: 'Average', percentage, color: 'orange' }
    if (percentage < 75) return { label: 'Good', percentage, color: 'yellow' }
    return { label: 'Excellent', percentage, color: 'green' }
  }

  const adStrength = calculateAdStrength()

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const addHeadline = () => {
    if (headlines.length < 15) {
      setHeadlines([...headlines, ''])
    }
  }

  const updateHeadline = (index: number, value: string) => {
    const updated = [...headlines]
    updated[index] = value
    setHeadlines(updated)
  }

  const removeHeadline = (index: number) => {
    if (headlines.length > 3) {
      setHeadlines(headlines.filter((_, i) => i !== index))
    }
  }

  const addDescription = () => {
    if (descriptions.length < 4) {
      setDescriptions([...descriptions, ''])
    }
  }

  const updateDescription = (index: number, value: string) => {
    const updated = [...descriptions]
    updated[index] = value
    setDescriptions(updated)
  }

  const removeDescription = (index: number) => {
    if (descriptions.length > 2) {
      setDescriptions(descriptions.filter((_, i) => i !== index))
    }
  }

  const addSitelink = () => {
    setSitelinks([...sitelinks, { text: '', url: '' }])
  }

  const addCallout = () => {
    setCallouts([...callouts, ''])
  }

  const addImage = () => {
    if (images.length < 5) {
      setImages([...images, { url: '', alt: '' }])
    }
  }

  const updateImage = (index: number, field: 'url' | 'alt', value: string) => {
    const updated = [...images]
    updated[index][field] = value
    setImages(updated)
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const setLogoUrl = (url: string) => {
    if (url.trim()) {
      setLogo({ url: url.trim(), alt: businessName || 'Business Logo' })
    } else {
      setLogo(null)
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      red: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500' },
      yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500' },
      green: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500' }
    }
    return colors[color as keyof typeof colors] || colors.yellow
  }

  const colorClasses = getColorClasses(adStrength.color)

  // Get suggestions based on current ad state
  const getSuggestions = () => {
    const suggestions = []
    const filledHeadlines = headlines.filter(h => h.trim().length > 0)
    const filledDescriptions = descriptions.filter(d => d.trim().length > 0)

    if (filledHeadlines.length < 5) {
      suggestions.push({ text: 'Add more unique headlines', completed: false })
    }
    if (filledHeadlines.length < 10) {
      suggestions.push({ text: 'Add at least 8-10 headlines for better performance', completed: false })
    } else {
      suggestions.push({ text: 'Good headline variety', completed: true })
    }

    if (filledDescriptions.length < 3) {
      suggestions.push({ text: 'Add more descriptions', completed: false })
    } else {
      suggestions.push({ text: 'Descriptions look good', completed: true })
    }

    suggestions.push({ text: 'Include your keywords in headlines', completed: false })
    suggestions.push({ text: 'Make headlines unique', completed: filledHeadlines.length >= 5 })

    return suggestions
  }

  const suggestions = getSuggestions()

  // Debug: Log when finalUrl changes
  useEffect(() => {
    console.log('AdPreview finalUrl state changed to:', finalUrl)
  }, [finalUrl])

  // Helper function to normalize URL (add https:// if missing)
  const normalizeUrl = (url: string) => {
    if (!url) return url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url
    }
    return url
  }

  // Helper function to safely extract hostname from URL
  const getHostname = (url: string, fallback: string = 'example.com'): string => {
    if (!url) return fallback
    try {
      const normalizedUrl = normalizeUrl(url)
      const hostname = new URL(normalizedUrl).hostname
      console.log('getHostname input:', url, 'normalized:', normalizedUrl, 'output:', hostname)
      return hostname
    } catch (error) {
      console.log('getHostname error for:', url, 'error:', error, 'using fallback:', fallback)
      return fallback
    }
  }

  // Show lead-related options based on reach methods selected in Step 1
  const showCallsOption = selectedReachMethods.includes('Phone calls')
  const showLeadFormOption = selectedReachMethods.includes('Lead form submissions')
  const showLeadOptions = showCallsOption || showLeadFormOption

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Fixed Top Bar - Ad Strength */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ad strength</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClasses.bg}`}></div>
              <span className={`text-sm font-semibold ${colorClasses.text}`}>{adStrength.label}</span>
            </div>
            <div className="w-40 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colorClasses.bg}`}
                style={{ width: `${adStrength.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Inline Suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${suggestion.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={suggestion.completed ? 'text-green-700' : 'text-gray-600'}>
                {suggestion.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Input Configuration Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

          {/* Final URL */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('finalUrl')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">Final URL</h3>
                {!expandedSections.finalUrl && finalUrl && (
                  <p className="text-xs text-gray-500 mt-0.5">{finalUrl}</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.finalUrl ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.finalUrl && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-2">The landing page people reach when they click your ad</p>
                <input
                  type="url"
                  value={finalUrl}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    console.log('Typed Final URL:', inputValue, '→ Parsed domain:', getHostname(inputValue))
                    setFinalUrl(inputValue)
                  }}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}
          </div>

          {/* Display Path */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('displayPath')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">Display path <span className="text-gray-400">(optional)</span></h3>
                {!expandedSections.displayPath && (displayPath1 || displayPath2) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {displayPath1 && `/${displayPath1}`}{displayPath2 && `/${displayPath2}`}
                  </p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.displayPath ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.displayPath && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500 mb-2">Text shown in your ad's URL</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Display path</label>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">
                        {getHostname(finalUrl, 'www.example.com')} /
                      </div>
                      <input
                        type="text"
                        value={displayPath1}
                        onChange={(e) => setDisplayPath1(e.target.value)}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="text-xs text-gray-400">{displayPath1.length} / 15</div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={displayPath2}
                        onChange={(e) => setDisplayPath2(e.target.value)}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="text-xs text-gray-400">{displayPath2.length} / 15</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Headlines */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('headlines')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">Headlines</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {headlines.filter(h => h.trim()).length} of {headlines.length} • Add up to 15
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.headlines ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.headlines && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Create headlines for your ad. At least 3 required.</p>
                {headlines.map((headline, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => updateHeadline(index, e.target.value)}
                        placeholder={`Headline ${index + 1}`}
                        maxLength={30}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="text-xs text-gray-400 mt-1">{headline.length}/30</div>
                    </div>
                    {headlines.length > 3 && (
                      <button
                        onClick={() => removeHeadline(index)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {headlines.length < 15 && (
                  <button
                    onClick={addHeadline}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                  >
                    + Add headline
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('descriptions')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">Descriptions</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {descriptions.filter(d => d.trim()).length} of {descriptions.length} • Add up to 4
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.descriptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.descriptions && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Create descriptions for your ad. At least 2 required.</p>
                {descriptions.map((description, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1">
                      <textarea
                        value={description}
                        onChange={(e) => updateDescription(index, e.target.value)}
                        placeholder={`Description ${index + 1}`}
                        maxLength={90}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      />
                      <div className="text-xs text-gray-400 mt-1">{description.length}/90</div>
                    </div>
                    {descriptions.length > 2 && (
                      <button
                        onClick={() => removeDescription(index)}
                        className="p-2 text-gray-400 hover:text-red-600 mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {descriptions.length < 4 && (
                  <button
                    onClick={addDescription}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                  >
                    + Add description
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('images')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">🖼️ Images <span className="text-gray-400">(optional)</span></h3>
                <p className="text-xs text-gray-500 mt-0.5">{images.filter(img => img.url.trim()).length} images added</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.images ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.images && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500">Add images to showcase your products or services</p>
                {images.map((image, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-md space-y-2">
                    <input
                      type="url"
                      value={image.url}
                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                      placeholder="Image URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateImage(index, 'alt', e.target.value)}
                      placeholder="Alt text (for accessibility)"
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">{image.alt.length}/100</div>
                      <button
                        onClick={() => removeImage(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={addImage}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                  >
                    + Add image
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Business Name */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('businessName')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">🏢 Business name <span className="text-gray-400">(optional)</span></h3>
                {!expandedSections.businessName && businessName && (
                  <p className="text-xs text-gray-500 mt-0.5">{businessName}</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.businessName ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.businessName && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-2">Your business name as it should appear in ads</p>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Name"
                  maxLength={25}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="text-xs text-gray-400 mt-1">{businessName.length}/25</div>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('logo')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">🎨 Logo <span className="text-gray-400">(optional)</span></h3>
                {!expandedSections.logo && logo && (
                  <p className="text-xs text-gray-500 mt-0.5">Logo added</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.logo ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.logo && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500">Add your business logo to enhance brand recognition</p>
                <input
                  type="url"
                  value={logo?.url || ''}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {logo && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <img 
                      src={logo.url} 
                      alt={logo.alt}
                      className="w-8 h-8 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-xs text-gray-600">Logo preview</span>
                  </div>
                )}
                {logo && (
                  <button
                    onClick={() => setLogo(null)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Calls (only if selected in Step 1) */}
          {showCallsOption && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('calls')}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-900">📞 Calls <span className="text-gray-400">(optional)</span></h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add phone number to get more calls</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.calls ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.calls && (
                <div className="px-4 pb-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={enableCalls}
                      onChange={(e) => setEnableCalls(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable call extension</span>
                  </label>
                  {enableCalls && (
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lead Forms (only if selected in Step 1) */}
          {showLeadFormOption && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('leadForms')}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-900">📝 Lead forms <span className="text-gray-400">(optional)</span></h3>
                  <p className="text-xs text-gray-500 mt-0.5">Collect leads directly from your ad</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.leadForms ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.leadForms && (
                <div className="px-4 pb-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={enableLeadForm}
                      onChange={(e) => setEnableLeadForm(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable lead form</span>
                  </label>
                  {enableLeadForm && (
                    <button
                      onClick={onOpenLeadForm}
                      className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                    >
                      Create lead form
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sitelinks */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('sitelinks')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">🔗 Sitelinks <span className="text-gray-400">(optional)</span></h3>
                <p className="text-xs text-gray-500 mt-0.5">{sitelinks.length} sitelinks added</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.sitelinks ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.sitelinks && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500">Add links to specific pages on your site</p>
                {sitelinks.map((sitelink, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-md space-y-2">
                    <input
                      type="text"
                      value={sitelink.text}
                      onChange={(e) => {
                        const updated = [...sitelinks]
                        updated[index].text = e.target.value
                        setSitelinks(updated)
                      }}
                      placeholder="Sitelink text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={sitelink.url}
                      onChange={(e) => {
                        const updated = [...sitelinks]
                        updated[index].url = e.target.value
                        setSitelinks(updated)
                      }}
                      placeholder="https://example.com/page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <button
                  onClick={addSitelink}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                >
                  + Add sitelink
                </button>
              </div>
            )}
          </div>

          {/* Callouts */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('callouts')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">💬 Callouts <span className="text-gray-400">(optional)</span></h3>
                <p className="text-xs text-gray-500 mt-0.5">{callouts.filter(c => c.trim()).length} callouts added</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.callouts ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.callouts && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Highlight key features (e.g., "Free Shipping", "24/7 Support")</p>
                {callouts.map((callout, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={callout}
                      onChange={(e) => {
                        const updated = [...callouts]
                        updated[index] = e.target.value
                        setCallouts(updated)
                      }}
                      placeholder={`Callout ${index + 1}`}
                      maxLength={25}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => setCallouts(callouts.filter((_, i) => i !== index))}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCallout}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                >
                  + Add callout
                </button>
              </div>
            )}
          </div>

          {/* Structured Snippets */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('structuredSnippets')}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">📋 Structured snippets <span className="text-gray-400">(optional)</span></h3>
                <p className="text-xs text-gray-500 mt-0.5">Showcase product categories or services</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.structuredSnippets ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.structuredSnippets && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-3">Example: "Services: Web Design, SEO, Marketing"</p>
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600">Structured snippets coming soon...</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Pane - Ad Preview Area */}
        <div className="w-[550px] border-l border-gray-200 bg-white flex flex-col">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Ad preview</h3>

            {/* Preview Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setPreviewTab('mobile')}
                className={`px-4 py-2 text-sm font-medium ${previewTab === 'mobile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Mobile
              </button>
              <button
                onClick={() => setPreviewTab('desktop')}
                className={`px-4 py-2 text-sm font-medium ${previewTab === 'desktop'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Desktop
              </button>
            </div>

            {/* Share/Preview Buttons */}
            <div className="flex gap-2 mb-4">
              <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Share
              </button>
              <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Preview
              </button>
            </div>
          </div>

            {/* Live Ad Preview Carousel */}
          <div className="flex-1 overflow-hidden">
            <AdPreviewCarousel 
              data={{
                finalUrl,
                displayPath1,
                displayPath2,
                headlines,
                descriptions,
                phoneNumber,
                enableCalls,
                enableLeadForm,
                sitelinks,
                callouts,
                structuredSnippets,
                images,
                businessName,
                logo
              }}
              onOpenLeadForm={onOpenLeadForm}
              type={previewTab}
            />
          </div>

          {/* Footer Disclaimer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              Previews shown here are examples and don't include all possible formats. Your ad may look different depending on placement.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center">
        <button className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
          Cancel
        </button>
        <div className="flex items-center gap-4">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Preview ads
          </button>
          <button className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            Save ad
          </button>
        </div>
      </div>
    </div>
  )
}
