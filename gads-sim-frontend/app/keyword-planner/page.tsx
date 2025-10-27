'use client'

import React from 'react'
import Link from 'next/link'

export default function KeywordPlanner() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link 
                href="/"
                className="text-gray-400 hover:text-gray-600 mr-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Keyword Planner</h1>
            </div>
            <p className="text-gray-600 mt-1 ml-9">Find the right keywords for your campaigns</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Discover New Keywords Card */}
          <Link href="/keyword-planner/discover" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg 
                    className="w-8 h-8 text-yellow-600" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Discover new keywords
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Get keyword ideas that can help you reach people interested in your product or service
                </p>
              </div>
            </div>
          </Link>

          {/* Get Search Volume and Forecasts Card */}
          <Link href="/keyword-planner/forecasts" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg 
                    className="w-8 h-8 text-blue-600" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {/* Browser window with chart */}
                    <rect x="2" y="4" width="20" height="14" rx="2" fill="white" stroke="currentColor" strokeWidth="1"/>
                    <rect x="2" y="4" width="20" height="3" fill="#fbbf24" rx="2"/>
                    <circle cx="4" cy="5.5" r="0.5" fill="#374151"/>
                    <circle cx="6" cy="5.5" r="0.5" fill="#374151"/>
                    {/* Chart line */}
                    <path d="M4 12 L8 10 L12 8 L16 6 L20 4" stroke="#1f2937" strokeWidth="2" fill="none"/>
                    <circle cx="4" cy="12" r="1" fill="white" stroke="#1f2937" strokeWidth="1"/>
                    <circle cx="8" cy="10" r="1" fill="#10b981" stroke="#1f2937" strokeWidth="1"/>
                    <circle cx="12" cy="8" r="1" fill="#3b82f6" stroke="#1f2937" strokeWidth="1"/>
                    {/* Upward arrow */}
                    <path d="M18 6 L20 4 L22 6" stroke="#3b82f6" strokeWidth="2" fill="none"/>
                    <path d="M20 4 L20 8" stroke="#3b82f6" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Get search volume and forecasts
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Get search volume and other historical metrics, plus forecasts for how they could perform
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Keyword Planner Features
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Discover relevant keywords based on your business</li>
                    <li>Get historical search volume data</li>
                    <li>View keyword performance forecasts</li>
                    <li>Analyze competition levels</li>
                    <li>Export keyword lists for your campaigns</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
