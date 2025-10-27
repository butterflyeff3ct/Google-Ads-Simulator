'use client'

import React, { useState } from 'react'
import { CarouselProps } from './types'

// Import mobile previews
import MobilePreview1 from './mobile/MobilePreview1'
import MobilePreview2 from './mobile/MobilePreview2'
import MobilePreview3 from './mobile/MobilePreview3'
import MobilePreview4 from './mobile/MobilePreview4'

// Import desktop previews
import DesktopPreview1 from './desktop/DesktopPreview1'
import DesktopPreview2 from './desktop/DesktopPreview2'
import DesktopPreview3 from './desktop/DesktopPreview3'
import DesktopPreview4 from './desktop/DesktopPreview4'

const mobilePreviews = [
  { component: MobilePreview1, name: 'Standard Mobile' },
  { component: MobilePreview2, name: 'Modern Mobile' },
  { component: MobilePreview3, name: 'Enhanced Mobile' },
  { component: MobilePreview4, name: 'Premium Mobile' }
]

const desktopPreviews = [
  { component: DesktopPreview1, name: 'Standard Desktop' },
  { component: DesktopPreview2, name: 'Modern Desktop' },
  { component: DesktopPreview3, name: 'Enhanced Desktop' },
  { component: DesktopPreview4, name: 'Premium Desktop' }
]

export default function AdPreviewCarousel({ data, onOpenLeadForm, type }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const previews = type === 'mobile' ? mobilePreviews : desktopPreviews
  const CurrentPreview = previews[currentIndex].component

  const nextPreview = () => {
    setCurrentIndex((prev) => (prev + 1) % previews.length)
  }

  const prevPreview = () => {
    setCurrentIndex((prev) => (prev - 1 + previews.length) % previews.length)
  }

  const goToPreview = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Carousel Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {type === 'mobile' ? 'Mobile' : 'Desktop'} Preview
          </span>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} of {previews.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Preview Type Indicators */}
          <div className="flex gap-1">
            {previews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPreview(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex gap-1">
            <button
              onClick={prevPreview}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              disabled={previews.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPreview}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              disabled={previews.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Name */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">{previews[currentIndex].name}</h4>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <CurrentPreview data={data} onOpenLeadForm={onOpenLeadForm} />
        </div>
      </div>

      {/* Preview Type Selector */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          {previews.map((preview, index) => (
            <button
              key={index}
              onClick={() => goToPreview(index)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {preview.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
