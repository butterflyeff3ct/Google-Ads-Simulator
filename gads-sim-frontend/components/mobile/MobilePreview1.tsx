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

export default function MobilePreview1({ data, onOpenLeadForm }: PreviewComponentProps) {
  const { finalUrl, displayPath1, displayPath2, headlines, descriptions, phoneNumber, enableCalls, enableLeadForm, sitelinks, callouts, images, businessName, logo } = data

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Phone Frame */}
        <div className="w-64 h-[32rem] bg-gray-800 rounded-3xl p-3">
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
            {/* Phone Screen Content */}
            <div className="p-4 h-full flex flex-col">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Ad Content */}
              <div className="flex-1">
                {/* Ad indicator */}
                <div className="text-xs text-gray-500 mb-2">Ad • {getHostname(finalUrl)}</div>
                
                {/* Business Name and Logo */}
                {(businessName || logo) && (
                  <div className="mb-2 flex items-center gap-2">
                    {logo && (
                      <img 
                        src={logo.url} 
                        alt={logo.alt}
                        className="w-4 h-4 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    {businessName && (
                      <span className="text-xs font-medium text-gray-700">{businessName}</span>
                    )}
                  </div>
                )}
                
                {/* Headlines */}
                <h3 className="text-blue-600 text-sm font-normal mb-2 leading-tight">
                  {headlines.filter(h => h.trim())[0] || 'Your headline here'} | {headlines.filter(h => h.trim())[1] || 'Another headline'}
                </h3>
                
                {/* Display URL */}
                <div className="text-green-700 text-xs mb-2">
                  {getHostname(finalUrl)}
                  {displayPath1 && <span className="text-green-700"> › {displayPath1}</span>}
                  {displayPath2 && <span className="text-green-700"> › {displayPath2}</span>}
                </div>
                
                {/* Description */}
                <p className="text-xs text-gray-800 leading-relaxed mb-3">
                  {descriptions.filter(d => d.trim())[0] || 'Your description here. Tell customers what makes your business unique.'}
                </p>

                {/* Call button for leads */}
                {enableCalls && phoneNumber && (
                  <div className="mb-3 flex items-center gap-1 text-blue-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-xs font-medium">Call</span>
                  </div>
                )}

                {/* Lead form button */}
                {enableLeadForm && (
                  <button
                    onClick={onOpenLeadForm}
                    className="mb-3 w-full px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    Get started
                  </button>
                )}

                {/* Sitelinks */}
                {sitelinks.filter(s => s.text.trim()).length > 0 && (
                  <div className="mb-3 grid grid-cols-2 gap-1">
                    {sitelinks.filter(s => s.text.trim()).slice(0, 4).map((sitelink, index) => (
                      <div key={index} className="text-blue-600 text-xs">
                        {sitelink.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Images */}
                {images.filter(img => img.url.trim()).length > 0 && (
                  <div className="mb-3">
                    <div className="grid grid-cols-2 gap-1">
                      {images.filter(img => img.url.trim()).slice(0, 2).map((image, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={image.url} 
                            alt={image.alt}
                            className="w-full h-16 object-cover rounded"
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
                  <div className="text-xs text-gray-600">
                    {callouts.filter(c => c.trim()).slice(0, 4).join(' • ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
