'use client'

import React, { useEffect, useState } from 'react'

interface Step7Props {
  onNext: () => void
  onBack: () => void
  initialDailyBudget?: number
  onUpdateDailyBudget?: (value: number) => void
}

export default function Step7({ onNext, onBack, initialDailyBudget, onUpdateDailyBudget }: Step7Props) {
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('daily')
  const [dailyBudget, setDailyBudget] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [expandedSections, setExpandedSections] = useState({
    budget: true,
    advanced: false
  })

  // Initialize from parent value if provided
  useEffect(() => {
    if (typeof initialDailyBudget === 'number' && !isNaN(initialDailyBudget)) {
      setDailyBudget(String(initialDailyBudget))
    }
  }, [initialDailyBudget])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatCurrency = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleBudgetChange = (value: string, type: 'daily' | 'total') => {
    const numericValue = value.replace(/[^0-9.]/g, '')
    if (type === 'daily') {
      setDailyBudget(numericValue)
      const parsed = parseFloat(numericValue)
      if (!isNaN(parsed) && parsed >= 0 && onUpdateDailyBudget) {
        onUpdateDailyBudget(parsed)
      }
    } else {
      setTotalBudget(numericValue)
    }
  }

  const handleNextClick = () => {
    if (budgetType === 'daily') {
      const parsed = parseFloat(dailyBudget)
      if (!isNaN(parsed) && onUpdateDailyBudget) {
        onUpdateDailyBudget(parsed)
      }
    }
    onNext()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Set your budget</h1>
            <p className="text-sm text-gray-600 mt-1">
              Choose how much you want to spend on your campaign.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Budget Section */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('budget')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Budget</h2>
              <p className="text-sm text-gray-600 mt-1">
                {budgetType === 'daily' 
                  ? (dailyBudget ? `$${formatCurrency(dailyBudget)} per day` : 'Set your daily budget')
                  : (totalBudget ? `$${formatCurrency(totalBudget)} total` : 'Set your total budget')
                }
              </p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.budget ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.budget && (
            <div className="px-6 pb-6 space-y-6">
              {/* Budget Type Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Budget type</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetType"
                      value="daily"
                      checked={budgetType === 'daily'}
                      onChange={(e) => setBudgetType(e.target.value as 'daily' | 'total')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Daily budget</div>
                      <div className="text-sm text-gray-600">Set a daily spending limit for your campaign</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetType"
                      value="total"
                      checked={budgetType === 'total'}
                      onChange={(e) => setBudgetType(e.target.value as 'daily' | 'total')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Total budget</div>
                      <div className="text-sm text-gray-600">Set a total spending limit for your campaign</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Budget Amount */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Budget amount</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {budgetType === 'daily' ? 'Daily budget' : 'Total budget'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        value={budgetType === 'daily' ? dailyBudget : totalBudget}
                        onChange={(e) => handleBudgetChange(e.target.value, budgetType)}
                        placeholder="0.00"
                        className="pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {budgetType === 'daily' 
                        ? 'Minimum $1.00 per day'
                        : 'Minimum $1.00 total'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Budget recommendations</h4>
                    <p className="text-sm text-blue-800">
                      Start with a daily budget of $10-50 to get enough data for optimization. 
                      You can always adjust your budget later based on performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Advanced Settings */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
          >
            <div>
              <h2 className="text-lg font-medium text-gray-900">Advanced settings</h2>
              <p className="text-sm text-gray-600 mt-1">Optional settings for advanced users</p>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.advanced && (
            <div className="px-6 pb-6 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Advanced bidding and budget settings will be available in future updates.
                </p>
              </div>
            </div>
          )}
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
          <span className="text-sm text-gray-500">Step 7 of 9</span>
          <button 
            onClick={handleNextClick}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
