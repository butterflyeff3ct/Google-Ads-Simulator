'use client'

import React from 'react'
import { PreviewComponentProps } from '../types'

// Helper function to safely extract hostname from URL
const getHostname = (url: string, fallback: string = 'example.com'): string => {
  if (!url) return fallback
  try {
    const normalizedUrl = url.startsWith('http') ? url : 'https://' + url
    return new URL(normalizedUrl).hostname
  } catch (error) {
    return fallback
  }
}

export default function DesktopPreview1({ data, onOpenLeadForm }: PreviewComponentProps) {
  const { finalUrl, displayPath1, displayPath2, headlines, descriptions, phoneNumber, enableCalls, enableLeadForm, sitelinks, callouts, images, businessName, logo } = data

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">Ad • {getHostname(finalUrl)}</div>
          
          {/* Business Name and Logo */}
          {(businessName || logo) && (
            <div className="mb-2 flex items-center gap-2">
              {logo && (
                <img 
                  src={logo.url} 
                  alt={logo.alt}
                  className="w-6 h-6 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              {businessName && (
                <span className="text-sm font-medium text-gray-700">{businessName}</span>
              )}
            </div>
          )}
          
          <h3 className="text-blue-600 text-xl font-normal mb-1">
            {headlines.filter(h => h.trim())[0] || 'Your headline here'} - {headlines.filter(h => h.trim())[1] || 'Another headline'}
          </h3>
          <div className="text-green-700 text-sm mb-2">
            {getHostname(finalUrl)}
            {displayPath1 && <span className="text-green-700"> › {displayPath1}</span>}
            {displayPath2 && <span className="text-green-700"> › {displayPath2}</span>}
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {descriptions.filter(d => d.trim())[0] || 'Your description here. Tell customers what makes your business unique and why they should choose you.'}
          </p>

          {/* Call button for leads */}
          {enableCalls && phoneNumber && (
            <div className="mt-3 inline-flex items-center gap-2 text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm font-medium">{phoneNumber}</span>
            </div>
          )}

          {/* Lead form button */}
          {enableLeadForm && (
            <button
              onClick={onOpenLeadForm}
              className="mt-3 px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Get started
            </button>
          )}

          {/* Sitelinks */}
          {sitelinks.filter(s => s.text.trim()).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {sitelinks.filter(s => s.text.trim()).slice(0, 6).map((sitelink, index) => (
                <div key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                  {sitelink.text}
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {images.filter(img => img.url.trim()).length > 0 && (
            <div className="mt-4">
              <div className="flex gap-2">
                {images.filter(img => img.url.trim()).slice(0, 3).map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Callouts */}
          {callouts.filter(c => c.trim()).length > 0 && (
            <div className="mt-3 text-sm text-gray-700">
              {callouts.filter(c => c.trim()).slice(0, 6).join(' • ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
