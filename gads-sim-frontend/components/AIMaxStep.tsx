'use client'

import { useState, useEffect } from 'react'
import { generateAIMaxContent, AdGroupSuggestion } from '@/lib/api'

interface AIMaxStepProps {
  onBack: () => void
  onNext: (data: {
    productDescription: string
    adGroups: AdGroupSuggestion[]
  }) => void
  onSkip: () => void
}

export default function AIMaxStep({ onBack, onNext, onSkip }: AIMaxStepProps) {
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
    <div>
      <h2 className="text-2xl font-bold mb-2">AI Max</h2>
      <p className="text-gray-400 mb-8">
        Generate product descriptions and ad groups using AI
      </p>

      {/* URL Input Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            What is the URL of the products or service you want to advertise?
          </label>
          <p className="text-xs text-gray-400 mb-4">
            Google Ads will suggest a campaign structure based on your URL.
          </p>
          
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">
                Final URL (required)*
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="flixbus.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
                disabled={isGenerating}
              />
              {url && !isGenerating && !hasGenerated && (
                <p className="text-xs text-blue-400 mt-1">AI will generate content automatically...</p>
              )}
            </div>
          </div>
          
          <p className="text-xs text-gray-500 italic mt-2">
            Keyword and asset generation is not available in all languages
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <p className="text-sm text-blue-200">
            Analyzing your website and generating content...
          </p>
        </div>
      )}

      {/* Success Message */}
      {hasGenerated && !isGenerating && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-200">
            ✓ Content generated successfully! You can edit the description and ad groups below.
          </p>
        </div>
      )}

      {/* Product Description Section */}
      {(hasGenerated || productDescription) && !isGenerating && (
        <>
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              What makes your products or services unique?
            </h3>
            <label className="text-xs text-gray-500 block mb-2">
              Describe the product or service to advertise (required)*
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
              placeholder="Enter your product or service description..."
            />
            <p className="text-xs text-gray-400 mt-2">
              {productDescription.split(' ').length} words (recommended: 100-150 words)
            </p>
          </div>

          {/* Ad Groups Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Review ad groups</h3>
            <p className="text-sm text-gray-400 mb-4">
              Google AI suggests these ad groups to make sure your ads are relevant to your keywords. 
              You can edit ad groups on the next step.{' '}
              <a href="#" className="text-blue-400 hover:underline">
                Organize your account with ad groups.
              </a>
            </p>

            <div className="space-y-4">
              {adGroups.map((group, index) => (
                <div 
                  key={index}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-2">{group.name}</div>
                      <div className="text-xs text-gray-400">
                        Final URL:{' '}
                        <a 
                          href={group.final_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {group.final_url}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAdGroup(editingAdGroup === index ? null : index)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Edit ad group"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRemoveAdGroup(index)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Remove ad group"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Edit Mode */}
                  {editingAdGroup === index && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Ad Group Name
                        </label>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => handleUpdateAdGroup(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Final URL
                        </label>
                        <input
                          type="text"
                          value={group.final_url}
                          onChange={(e) => handleUpdateAdGroup(index, 'final_url', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setEditingAdGroup(null)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleAddAdGroup}
                className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-900 text-blue-400 hover:text-blue-300 transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Add an ad group</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
              <p className="text-xs text-gray-400">
                By adding generated assets, you're confirming that you'll review the suggested keywords 
                and assets on the next page and ensure that they're accurate, not misleading, and not 
                in violation of any Google advertising policies or applicable laws before publishing them.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onSkip}
          className="text-blue-400 hover:underline text-sm"
        >
          Skip
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
          
          {(!hasGenerated && !productDescription) ? (
            <button
              onClick={() => handleGenerate(url)}
              disabled={!url.trim() || isGenerating}
              className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  🚀 Generate
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!productDescription || adGroups.length === 0}
              className="px-8 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Next ➜
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
