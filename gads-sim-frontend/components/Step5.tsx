'use client'

import { useState, useEffect } from 'react'
import { generateAIMaxContent, AdGroupSuggestion } from '@/lib/api'

interface Step5Props {
  onNext: (data: {
    productDescription: string
    adGroups: AdGroupSuggestion[]
  }) => void
  onBack: () => void
  onSkip: () => void
}

export default function Step5({ onNext, onBack, onSkip }: Step5Props) {
  const [url, setUrl] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [adGroups, setAdGroups] = useState<AdGroupSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [error, setError] = useState('')
  const [editingAdGroup, setEditingAdGroup] = useState<number | null>(null)
  const [urlDebounceTimer, setUrlDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Normalize URL helper (matches backend logic)
  const normalizeUrl = (inputUrl: string): string => {
    let normalizedUrl = inputUrl.trim()
    
    // Add https:// if no protocol
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    
    // Parse and reconstruct (simplified version of backend logic)
    try {
      const url = new URL(normalizedUrl)
      const domain = url.hostname.replace('www.', '')
      return `${url.protocol}//${domain}${url.pathname}`.replace(/\/$/, '')
    } catch {
      // Fallback to simple normalization
      return normalizedUrl.replace(/^(https?:\/\/)?(www\.)?/, 'https://').replace(/\/$/, '')
    }
  }

  const handleGenerate = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      return
    }

    console.log('Starting generation for URL:', inputUrl)
    setIsGenerating(true)
    setError('')
    
    try {
      const normalizedUrl = normalizeUrl(inputUrl)
      console.log('Normalized URL:', normalizedUrl)
      
      const response = await generateAIMaxContent({
        url: normalizedUrl,
        include_description: true,
        include_ad_groups: true
      })
      
      console.log('API Response:', response)

      if (response.product_description || response.ad_groups?.length > 0) {
        setProductDescription(response.product_description || '')
        setAdGroups(response.ad_groups || [])
        setHasGenerated(true)
        console.log('Content set successfully')
        
        // Clear any previous errors
        setError('')
      } else {
        // Use fallback mock data if API returns empty
        console.log('API returned empty, using mock data')
        const mockDescription = `${inputUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]} is a leading provider of innovative solutions designed to meet your needs. We specialize in delivering high-quality products and services that combine cutting-edge technology with exceptional customer service. Our experienced team is dedicated to providing reliable, efficient, and cost-effective solutions tailored to your specific requirements. With a proven track record of success and a commitment to continuous improvement, we help businesses and individuals achieve their goals. Choose us for professional service, competitive pricing, and results you can trust.`
        
        const mockAdGroups = [
          {
            name: `${inputUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]} - Main`,
            final_url: normalizedUrl
          },
          {
            name: `${inputUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]} - Services`,
            final_url: normalizedUrl
          }
        ]
        
        setProductDescription(mockDescription)
        setAdGroups(mockAdGroups)
        setHasGenerated(true)
        setError('Using mock data - API returned empty response')
      }
    } catch (err: any) {
      console.error('Generation error:', err)
      
      // Only use mock data if there's a real API error (network, server, etc.)
      // Not for empty responses or parsing errors
      if (err.message?.includes('Failed to fetch') || 
          err.message?.includes('NetworkError') || 
          err.message?.includes('500') ||
          err.message?.includes('404')) {
        
        console.log('Real API error detected, using mock data as fallback')
        
        // If API fails, use mock data as fallback
        const companyName = inputUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]
        const mockDescription = `${companyName.charAt(0).toUpperCase() + companyName.slice(1)} is a leading provider of innovative solutions designed to meet your needs. We specialize in delivering high-quality products and services that combine cutting-edge technology with exceptional customer service. Our experienced team is dedicated to providing reliable, efficient, and cost-effective solutions tailored to your specific requirements. With a proven track record of success and a commitment to continuous improvement, we help businesses and individuals achieve their goals. Choose us for professional service, competitive pricing, and results you can trust.`
        
        const normalizedUrl = normalizeUrl(inputUrl)
        const mockAdGroups = [
          {
            name: `${companyName.charAt(0).toUpperCase() + companyName.slice(1)} - Main`,
            final_url: normalizedUrl
          },
          {
            name: `${companyName.charAt(0).toUpperCase() + companyName.slice(1)} - Services`,
            final_url: normalizedUrl
          }
        ]
        
        setProductDescription(mockDescription)
        setAdGroups(mockAdGroups)
        setHasGenerated(true)
        
        // Show error but continue with mock data
        setError(`Using mock data. API Error: ${err.message || 'Failed to connect to backend'}`)
      } else {
        // For other errors (like parsing), don't use mock data
        console.error('Non-network error, not using mock data:', err)
        setError(`Generation failed: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate when URL is entered (with debounce)
  useEffect(() => {
    // Clear existing timer
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer)
    }

    // Don't generate if URL is empty or already generating
    if (!url.trim() || isGenerating) {
      return
    }

    // Check if URL looks valid (has domain)
    const urlPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/
    const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '')
    
    if (!urlPattern.test(cleanUrl)) {
      return
    }

    // Set a new timer to generate after 1.5 seconds of no typing
    const timer = setTimeout(() => {
      handleGenerate(url)
    }, 1500)

    setUrlDebounceTimer(timer)

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [url])

  const handleAddAdGroup = () => {
    const baseUrl = normalizeUrl(url)
    setAdGroups([
      ...adGroups,
      {
        name: `New Ad Group ${adGroups.length + 1}`,
        final_url: baseUrl
      }
    ])
  }

  const handleUpdateAdGroup = (index: number, field: 'name' | 'final_url', value: string) => {
    const updated = [...adGroups]
    updated[index] = { ...updated[index], [field]: value }
    setAdGroups(updated)
  }

  const handleRemoveAdGroup = (index: number) => {
    setAdGroups(adGroups.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    onNext({
      productDescription,
      adGroups
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Keyword and asset generation</h1>
        <p className="text-gray-600">
          Generate product descriptions and ad groups using AI
        </p>
      </div>

      {/* URL Input Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            What is the URL of the products or service you want to advertise?
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Google Ads will suggest a campaign structure based on your URL.
          </p>
          
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="text-sm text-gray-700 block mb-1">
                Final URL (required)*
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="flixbus.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              />
              {url && !isGenerating && !hasGenerated && (
                <p className="text-sm text-blue-600 mt-1">AI will generate content automatically...</p>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 italic mt-2">
            Keyword and asset generation is not available in all languages
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-sm text-blue-800">
            Analyzing your website and generating content...
          </p>
        </div>
      )}

      {/* Success Message */}
      {hasGenerated && !isGenerating && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            ✓ Content generated successfully! You can edit the description and ad groups below.
          </p>
        </div>
      )}

      {/* Product Description Section */}
      {(hasGenerated || productDescription) && !isGenerating && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What makes your products or services unique?
            </h3>
            <label className="text-sm text-gray-700 block mb-2">
              Describe the product or service to advertise (required)*
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your product or service description..."
            />
            <p className="text-sm text-gray-500 mt-2">
              {productDescription.split(' ').length} words (recommended: 100-150 words)
            </p>
          </div>

          {/* Ad Groups Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review ad groups</h3>
            <p className="text-sm text-gray-600 mb-4">
              Google AI suggests these ad groups to make sure your ads are relevant to your keywords. 
              You can edit ad groups on the next step.{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Organize your account with ad groups.
              </a>
            </p>

            <div className="space-y-4">
              {adGroups.map((group, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">{group.name}</div>
                      <div className="text-sm text-gray-600">
                        Final URL:{' '}
                        <a 
                          href={group.final_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {group.final_url}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAdGroup(editingAdGroup === index ? null : index)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit ad group"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRemoveAdGroup(index)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Remove ad group"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Edit Mode */}
                  {editingAdGroup === index && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          Ad Group Name
                        </label>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => handleUpdateAdGroup(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          Final URL
                        </label>
                        <input
                          type="text"
                          value={group.final_url}
                          onChange={(e) => handleUpdateAdGroup(index, 'final_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => setEditingAdGroup(null)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleAddAdGroup}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition flex items-center justify-center gap-2 font-medium"
              >
                <span className="text-xl">+</span>
                <span>Add an ad group</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">
                By adding generated assets, you're confirming that you'll review the suggested keywords 
                and assets on the next page and ensure that they're accurate, not misleading, and not 
                in violation of any Google advertising policies or applicable laws before publishing them.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Bottom buttons */}
      <div className="flex justify-between items-center mt-8">
        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Back
          </button>
          <button 
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip this step
          </button>
        </div>
        <button 
          onClick={handleNext}
          disabled={!hasGenerated || !productDescription.trim()}
          className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

