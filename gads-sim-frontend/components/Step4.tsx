'use client'

import { useState } from 'react'

interface Step4Props {
  onNext: () => void
  onBack: () => void
}

export default function Step4({ onNext, onBack }: Step4Props) {
  // AI Max state
  const [aiMaxEnabled, setAiMaxEnabled] = useState(true)
  const [textCustomization, setTextCustomization] = useState(true)
  const [finalUrlExpansion, setFinalUrlExpansion] = useState(true)
  const [showAssetOptimization, setShowAssetOptimization] = useState(false)
  const [showBrands, setShowBrands] = useState(false)
  const [brandInclusions, setBrandInclusions] = useState<string[]>([])
  const [brandExclusions, setBrandExclusions] = useState<string[]>([])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Max</h1>
        <p className="text-gray-600">
          Optimize your campaign with AI-powered features
        </p>
      </div>

      {/* Header Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Get the best AI-powered performance on Google Search.</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Engage more customers and boost performance.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Tailor ads to each customer using Google AI.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Track and analyze new insights in search reports.</span>
              </div>
            </div>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm mt-3 inline-block font-medium">
              Learn more
            </a>
          </div>
          <button className="text-blue-500 hover:text-blue-600" title="Information about AI Max">
            ⓘ
          </button>
        </div>
      </div>

      {/* AI Max Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiMaxEnabled}
                onChange={(e) => {
                  setAiMaxEnabled(e.target.checked)
                  if (!e.target.checked) {
                    setTextCustomization(false)
                    setFinalUrlExpansion(false)
                  } else {
                    setTextCustomization(true)
                    setFinalUrlExpansion(true)
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-900">Optimize your campaign with AI Max</span>
          </div>
        </div>
      </div>

      {/* Asset Optimization Accordion */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button
          onClick={() => setShowAssetOptimization(!showAssetOptimization)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <span className="font-semibold text-gray-900">Asset optimization</span>
          <span className="text-gray-400">{showAssetOptimization ? '∧' : '∨'}</span>
        </button>
        
        {showAssetOptimization && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
            <div className="pt-4">
              {/* Text customization */}
              <label className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={textCustomization}
                  onChange={(e) => setTextCustomization(e.target.checked)}
                  disabled={!aiMaxEnabled}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Text customization</span>
                    <button className="text-gray-400 hover:text-gray-600 text-xs" title="AI will customize ad text for better performance">
                      ⓘ
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Allow Google AI to customize your ad text to improve performance
                  </p>
                </div>
              </label>

              {/* Final URL Expansion */}
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={finalUrlExpansion}
                  onChange={(e) => setFinalUrlExpansion(e.target.checked)}
                  disabled={!aiMaxEnabled}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Final URL expansion</span>
                    <button className="text-gray-400 hover:text-gray-600 text-xs" title="AI will expand URLs to relevant landing pages">
                      ⓘ
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Allow Google AI to direct users to the most relevant pages on your website
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 text-xs mt-2 font-medium">
                    Add URL exclusions
                  </button>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Brands Accordion */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button
          onClick={() => setShowBrands(!showBrands)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <span className="font-semibold text-gray-900">Brands</span>
          <span className="text-gray-400">{showBrands ? '∧' : '∨'}</span>
        </button>
        
        {showBrands && (
          <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
            <div className="pt-4">
              {/* Brand Inclusions */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Brand inclusions</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Add brands you want to prioritize in your ads (up to 20)
                </p>
                <button
                  disabled={!aiMaxEnabled}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  Add brand lists
                </button>
                {brandInclusions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brandInclusions.map((brand, idx) => (
                      <div key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        {brand}
                        <button
                          onClick={() => setBrandInclusions(brandInclusions.filter((_, i) => i !== idx))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Exclusions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Brand exclusions</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Add brands you want to exclude from your ads
                </p>
                <button
                  disabled={!aiMaxEnabled}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  Add brand lists
                </button>
                {brandExclusions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brandExclusions.map((brand, idx) => (
                      <div key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2">
                        {brand}
                        <button
                          onClick={() => setBrandExclusions(brandExclusions.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <a href="#" className="text-blue-600 hover:text-blue-700 text-xs mt-4 inline-block font-medium">
                Learn more about brand settings
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance insights</h3>
          <p className="text-sm text-gray-600 mt-1">AI-powered recommendations to improve your campaign performance</p>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-sm font-medium text-green-900">Keyword optimization</span>
              </div>
              <p className="text-xs text-green-700">
                AI will automatically optimize your keywords for better performance
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 text-lg">✓</span>
                <span className="text-sm font-medium text-blue-900">Ad copy enhancement</span>
              </div>
              <p className="text-xs text-blue-700">
                AI will improve your ad copy to increase click-through rates
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600 text-lg">✓</span>
                <span className="text-sm font-medium text-purple-900">Landing page optimization</span>
              </div>
              <p className="text-xs text-purple-700">
                AI will direct users to the most relevant pages on your website
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600 text-lg">✓</span>
                <span className="text-sm font-medium text-orange-900">Audience targeting</span>
              </div>
              <p className="text-xs text-orange-700">
                AI will refine your audience targeting for better conversions
              </p>
            </div>
          </div>
        </div>
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
          className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  )
}

