'use client'

import { useState } from 'react'

interface Step2Props {
  onNext: () => void
  onBack: () => void
}

export default function Step2({ onNext, onBack }: Step2Props) {
  const [biddingExpanded, setBiddingExpanded] = useState(true)
  const [customerAcquisitionExpanded, setCustomerAcquisitionExpanded] = useState(false)
  
  // Bidding focus state
  const [biddingFocus, setBiddingFocus] = useState('clicks')
  const [maxCpcEnabled, setMaxCpcEnabled] = useState(false)
  const [maxCpcValue, setMaxCpcValue] = useState<number | ''>(2.50)
  
  // Target CPA state
  const [targetCpaEnabled, setTargetCpaEnabled] = useState(false)
  const [targetCpaValue, setTargetCpaValue] = useState<number | ''>(25.00)
  
  // Target ROAS state
  const [targetRoasEnabled, setTargetRoasEnabled] = useState(false)
  const [targetRoasValue, setTargetRoasValue] = useState<number | ''>(400)
  
  // Impression share state
  const [impressionShareLocation, setImpressionShareLocation] = useState('anywhere')
  const [impressionSharePercent, setImpressionSharePercent] = useState<number | ''>(65)
  const [impressionShareMaxCpc, setImpressionShareMaxCpc] = useState<number | ''>(2.50)
  
  // Customer acquisition state
  const [bidForNewCustomersOnly, setBidForNewCustomersOnly] = useState(false)

  // Bidding focus options
  const biddingFocusOptions = [
    { value: 'conversions', label: 'Conversions' },
    { value: 'conversion_value', label: 'Conversion Value' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'impression_share', label: 'Impression Share' }
  ]

  const getCurrentFocusLabel = () => {
    return biddingFocusOptions.find(f => f.value === biddingFocus)?.label || 'Clicks'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Bidding</h1>
        <p className="text-gray-600">
          Choose how you'd like to optimize your campaign. You can change your bid strategy at any time.
        </p>
      </div>

      {/* Bidding Section */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button 
          className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50"
          onClick={() => setBiddingExpanded(!biddingExpanded)}
        >
          <h2 className="text-lg font-semibold text-gray-900">Bidding</h2>
          <span className="text-gray-400 text-xl">
            {biddingExpanded ? '∧' : '∨'}
          </span>
        </button>
        
        {biddingExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200">
            {/* Current Focus Display */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Bid strategy</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  Change bid strategy
                  <span className="text-gray-400">?</span>
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{getCurrentFocusLabel()}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {biddingFocus === 'clicks' && 'Automatically sets bids to get the most clicks within your budget'}
                  {biddingFocus === 'conversions' && 'Automatically sets bids to help you get the most conversions within your budget'}
                  {biddingFocus === 'conversion_value' && 'Automatically sets bids to maximize conversion value within your budget'}
                  {biddingFocus === 'impression_share' && 'Show your ads in a target location on the search results page'}
                </div>
              </div>
            </div>

            {/* Focus Dropdown */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-900">What do you want to focus on?</label>
                <button className="text-gray-400 hover:text-gray-600 text-xs" title="Choose your primary bidding objective to optimize campaign performance">
                  ?
                </button>
              </div>
              <select
                value={biddingFocus}
                onChange={(e) => setBiddingFocus(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {biddingFocusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Strategy-specific options */}
            {biddingFocus === 'clicks' && (
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maxCpcEnabled}
                    onChange={(e) => setMaxCpcEnabled(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Set a maximum cost per click bid limit</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Optional. Helps control costs by setting a maximum amount you're willing to pay for a click.
                    </div>
                  </div>
                </label>
                
                {maxCpcEnabled && (
                  <div className="ml-7 pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-900">Maximum CPC bid limit</label>
                      <button className="text-gray-400 hover:text-gray-600 text-xs" title="The maximum amount you're willing to pay for a click">
                        ?
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={maxCpcValue}
                        onChange={(e) => setMaxCpcValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="2.50"
                        step="0.01"
                        min="0.01"
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {biddingFocus === 'conversions' && (
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetCpaEnabled}
                    onChange={(e) => setTargetCpaEnabled(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Set a target cost per action (optional)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Optional. Set a target cost per acquisition to help control costs.
                    </div>
                  </div>
                </label>
                
                {targetCpaEnabled && (
                  <div className="ml-7 pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-900">Target CPA</label>
                      <button className="text-gray-400 hover:text-gray-600 text-xs" title="Set a target cost per acquisition">
                        ?
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={targetCpaValue}
                        onChange={(e) => setTargetCpaValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="25.00"
                        step="0.01"
                        min="0.01"
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {biddingFocus === 'conversion_value' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-900">Target ROAS</label>
                  <button className="text-gray-400 hover:text-gray-600 text-xs" title="Set a target return on ad spend">
                    ?
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetRoasValue}
                    onChange={(e) => setTargetRoasValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="400"
                    step="1"
                    min="1"
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <div className="text-xs text-gray-500">
                  Set a target return on ad spend. For example, 400% means you want $4 in revenue for every $1 spent.
                </div>
              </div>
            )}


            {biddingFocus === 'impression_share' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-900">Where do you want your ads to appear</label>
                    <button className="text-gray-400 hover:text-gray-600 text-xs" title="Choose where on the search results page you want your ads to appear">
                      ?
                    </button>
                  </div>
                  <select
                    value={impressionShareLocation}
                    onChange={(e) => setImpressionShareLocation(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="anywhere">Anywhere on results page</option>
                    <option value="top">Top of results page</option>
                    <option value="absolute_top">Absolute top of results page</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-900">Percent (%) impression share to target</label>
                    <button className="text-gray-400 hover:text-gray-600 text-xs" title="The target percentage of impressions you want to achieve">
                      ?
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={impressionSharePercent}
                      onChange={(e) => setImpressionSharePercent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="65"
                      step="1"
                      min="1"
                      max="100"
                      className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-900">Maximum CPC bid limit</label>
                    <button className="text-gray-400 hover:text-gray-600 text-xs" title="The maximum amount you're willing to pay for a click">
                      ?
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={impressionShareMaxCpc}
                      onChange={(e) => setImpressionShareMaxCpc(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="2.50"
                      step="0.01"
                      min="0.01"
                      className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Acquisition Section */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <button 
          className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50"
          onClick={() => setCustomerAcquisitionExpanded(!customerAcquisitionExpanded)}
        >
          <h2 className="text-lg font-semibold text-gray-900">Customer acquisition</h2>
          <span className="text-gray-400 text-xl">
            {customerAcquisitionExpanded ? '∧' : '∨'}
          </span>
        </button>
        
        {customerAcquisitionExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bidForNewCustomersOnly}
                    onChange={(e) => setBidForNewCustomersOnly(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Bid for new customers only</div>
                    <div className="text-sm text-gray-600">
                      Your campaign will be limited to only new customers, regardless of your bid strategy
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="w-80 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  By default, your campaign bids equally for new and existing customers. However, you can configure your customer acquisition settings to optimize for acquiring new customers.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Learn more about customer acquisition
                </a>
              </div>
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
          className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  )
}
