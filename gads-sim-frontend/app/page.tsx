'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { healthCheck } from '@/lib/api'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    try {
      const data = await healthCheck()
      setApiStatus('online')
      setApiData(data)
    } catch (error) {
      setApiStatus('offline')
      console.error('Backend health check failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Google Ads Campaign Creation Wizard
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the authentic Google Ads campaign creation flow with our 8-step wizard
            that replicates the exact interface and workflows.
          </p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Frontend</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-green-400 font-bold text-lg">Next.js Running</p>
            <p className="text-sm text-gray-400">Port 3000</p>
          </div>

          <div className={`rounded-xl shadow-lg p-6 border-2 ${apiStatus === 'online'
            ? 'bg-gray-800 border-green-500'
            : apiStatus === 'offline'
              ? 'bg-gray-800 border-red-500'
              : 'bg-gray-800 border-yellow-500'
            }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Backend API</h3>
              <span className="text-2xl">
                {apiStatus === 'online' ? '✅' : apiStatus === 'offline' ? '❌' : '⏳'}
              </span>
            </div>
            <p className={`font-bold text-lg ${apiStatus === 'online'
              ? 'text-green-400'
              : apiStatus === 'offline'
                ? 'text-red-400'
                : 'text-yellow-400'
              }`}>
              {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Disconnected' : 'Checking...'}
            </p>
            <p className="text-sm text-gray-400">FastAPI on Port 8000</p>
          </div>
        </div>

        {/* Main Campaign Wizard Card */}
        <div className="max-w-4xl mx-auto">
          <Link href="/campaign/new" className="block">
            <div className="bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-gray-700 hover:border-red-500 group">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition">
                Create New Campaign
              </h3>
              <p className="text-gray-400 mb-4">
                Experience the full Google Ads campaign creation flow with our authentic 8-step wizard
                that matches the real interface pixel-perfectly.
              </p>
              <span className="text-red-400 font-semibold group-hover:underline text-lg">
                Start Campaign Creation →
              </span>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>✨</span>
                  <span>8-Step Google Ads-Style Wizard</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* What's Included */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-gray-700 mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span>✅</span>
            <span>Campaign Wizard Features</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 1: Campaign Goals</div>
                  <div className="text-sm text-gray-400">Sales, Leads, Website Traffic, Brand Awareness</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 2: Bidding Strategy</div>
                  <div className="text-sm text-gray-400">Manual CPC, Target CPA, Target ROAS, Maximize Clicks</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 3: Campaign Settings</div>
                  <div className="text-sm text-gray-400">Networks, Locations, Languages, Budget</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 4: Ad Groups</div>
                  <div className="text-sm text-gray-400">Multiple ad groups with themes</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 5: Keywords</div>
                  <div className="text-sm text-gray-400">Keyword research with AI-powered suggestions</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 6: Responsive Ads</div>
                  <div className="text-sm text-gray-400">Up to 15 headlines and 4 descriptions</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 7: Extensions</div>
                  <div className="text-sm text-gray-400">Sitelinks, Callouts, Structured Snippets</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-1">●</span>
                <div>
                  <div className="font-semibold text-white">Step 8: Review & Launch</div>
                  <div className="text-sm text-gray-400">Complete campaign overview before submission</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-gray-700 mt-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">🔗 Developer Links</h3>
          <ul className="space-y-3">
            <li>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-2"
              >
                <span>📖</span>
                <span>Backend API Documentation (FastAPI Swagger)</span>
              </a>
            </li>
            <li>
              <a
                href="http://localhost:8000/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-2"
              >
                <span>💚</span>
                <span>Health Check Endpoint</span>
              </a>
            </li>
            <li>
              <Link href="/campaign/new" className="text-blue-400 hover:underline flex items-center gap-2">
                <span>✨</span>
                <span>Campaign Creation Wizard (8 Steps)</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-6 bg-blue-900/30 border-l-4 border-blue-500 rounded-lg max-w-4xl mx-auto">
          <p className="text-gray-200">
            <strong className="font-bold text-white">🎯 Current Focus:</strong> Campaign Creation Wizard -
            Experience the authentic Google Ads campaign creation interface with our pixel-perfect 8-step wizard.
          </p>
        </div>

        {/* Contact Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-gray-700 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Need Help or Have Questions?</h3>
            <p className="text-gray-400 mb-6">
              Our team is here to help you get the most out of the Google Ads simulator. 
              Reach out to us for support, feedback, or any questions you might have.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-8 mt-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Google Ads Campaign Creation Wizard • Educational Tool
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Built with Next.js, FastAPI, and TypeScript
          </p>
        </div>
      </footer>
    </main>
  )
}
