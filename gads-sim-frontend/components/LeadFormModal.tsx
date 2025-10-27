'use client'

import { useState } from 'react'

interface CustomQuestion {
  question: string
  type: 'short_answer' | 'single_choice' | 'multiple_choice'
  options: string[]
}

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: any) => void
}

export default function LeadFormModal({ isOpen, onClose, onSave }: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    formName: '',
    headline: '',
    businessName: '',
    description: '',
    cta: 'Get quote',
    backgroundImage: '',
    selectedFields: ['First name', 'Email'],
    customQuestions: [] as CustomQuestion[],
    privacyPolicyUrl: '',
    privacyPolicyText: '',
    submissionHeadline: 'Thank you!',
    submissionDescription: "We'll contact you soon.",
    submissionCta: 'Visit website',
    submissionUrl: '',
    webhookUrl: '',
    webhookKey: ''
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleFieldSelection = (field: string) => {
    const currentFields = formData.selectedFields
    if (currentFields.includes(field)) {
      updateFormData('selectedFields', currentFields.filter(f => f !== field))
    } else {
      updateFormData('selectedFields', [...currentFields, field])
    }
  }

  const addCustomQuestion = () => {
    if (formData.customQuestions.length < 5) {
      updateFormData('customQuestions', [...formData.customQuestions, {
        question: '',
        type: 'short_answer' as const,
        options: []
      }])
    }
  }

  const removeCustomQuestion = (index: number) => {
    const newQuestions = formData.customQuestions.filter((_, i) => i !== index)
    updateFormData('customQuestions', newQuestions)
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create lead form asset</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Form Builder */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Form Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form name</label>
                  <input
                    type="text"
                    placeholder="Internal name for this lead form"
                    value={formData.formName}
                    onChange={(e) => updateFormData('formName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headline (max 30 characters)</label>
                  <input
                    type="text"
                    placeholder="Get your free quote today!"
                    value={formData.headline}
                    onChange={(e) => updateFormData('headline', e.target.value)}
                    maxLength={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">{formData.headline.length}/30</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business name (max 25 characters)</label>
                  <input
                    type="text"
                    placeholder="Your Company Name"
                    value={formData.businessName}
                    onChange={(e) => updateFormData('businessName', e.target.value)}
                    maxLength={25}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">{formData.businessName.length}/25</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (max 200 characters)</label>
                  <textarea
                    placeholder="Save up to 30% on solar installation. Fill out the form to get a quick estimate."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">{formData.description.length}/200</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Call-to-action</label>
                  <select
                    value={formData.cta}
                    onChange={(e) => updateFormData('cta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Get quote">Get quote</option>
                    <option value="Sign up">Sign up</option>
                    <option value="Apply now">Apply now</option>
                    <option value="Contact us">Contact us</option>
                    <option value="Get offer">Get offer</option>
                    <option value="Subscribe">Subscribe</option>
                    <option value="Download now">Download now</option>
                    <option value="Book now">Book now</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Questions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Predefined Fields</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['First name', 'Last name', 'Email', 'Phone number', 'City', 'ZIP / Postal code', 'State / Province', 'Country', 'Company name', 'Job title', 'Work email', 'Work phone number'].map((field) => (
                      <label key={field} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.selectedFields.includes(field)}
                          onChange={() => toggleFieldSelection(field)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Custom Questions (up to 5)</label>
                    {formData.customQuestions.length < 5 && (
                      <button
                        onClick={addCustomQuestion}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add question
                      </button>
                    )}
                  </div>
                  {formData.customQuestions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                        <button
                          onClick={() => removeCustomQuestion(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your question (max 100 characters)"
                        value={question.question}
                        onChange={(e) => {
                          const newQuestions: CustomQuestion[] = [...formData.customQuestions]
                          newQuestions[index] = {
                            ...newQuestions[index],
                            question: e.target.value
                          }
                          updateFormData('customQuestions', newQuestions)
                        }}
                        maxLength={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                      />
                      <select
                        value={question.type}
                        onChange={(e) => {
                          const newQuestions: CustomQuestion[] = [...formData.customQuestions]
                          newQuestions[index] = {
                            ...newQuestions[index],
                            type: e.target.value as 'short_answer' | 'single_choice' | 'multiple_choice'
                          }
                          updateFormData('customQuestions', newQuestions)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="short_answer">Short answer</option>
                        <option value="single_choice">Single choice</option>
                        <option value="multiple_choice">Multiple choice</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Policy */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Policy</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy policy URL</label>
                  <input
                    type="url"
                    placeholder="https://yourcompany.com/privacy"
                    value={formData.privacyPolicyUrl}
                    onChange={(e) => updateFormData('privacyPolicyUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy policy text (optional)</label>
                  <input
                    type="text"
                    placeholder="Your information is secure and won't be shared."
                    value={formData.privacyPolicyText}
                    onChange={(e) => updateFormData('privacyPolicyText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Submission Message */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Submission Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headline (max 30 characters)</label>
                  <input
                    type="text"
                    placeholder="Thank you!"
                    value={formData.submissionHeadline}
                    onChange={(e) => updateFormData('submissionHeadline', e.target.value)}
                    maxLength={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">{formData.submissionHeadline.length}/30</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (max 200 characters)</label>
                  <textarea
                    placeholder="We'll contact you soon with your quote."
                    value={formData.submissionDescription}
                    onChange={(e) => updateFormData('submissionDescription', e.target.value)}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">{formData.submissionDescription.length}/200</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call-to-action button</label>
                    <select
                      value={formData.submissionCta}
                      onChange={(e) => updateFormData('submissionCta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Visit website">Visit website</option>
                      <option value="Download">Download</option>
                      <option value="View offer">View offer</option>
                      <option value="Call now">Call now</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Final URL</label>
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={formData.submissionUrl}
                      onChange={(e) => updateFormData('submissionUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Delivery Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Delivery Options</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Download leads</span>
                  <span className="text-xs text-gray-500">(Default method)</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Webhook integration (optional)</label>
                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="Webhook URL"
                      value={formData.webhookUrl}
                      onChange={(e) => updateFormData('webhookUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Webhook key"
                      value={formData.webhookKey}
                      onChange={(e) => updateFormData('webhookKey', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 font-medium">
                      Send test data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Mobile Preview */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            
            {/* Mobile Phone Mockup */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-48 h-96 bg-gray-800 rounded-3xl p-2">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    {/* Phone Screen Content */}
                    <div className="p-4 h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">{formData.headline || 'Get your free quote today!'}</h4>
                        <p className="text-xs text-gray-600">{formData.businessName || 'Your Company Name'}</p>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-4 text-center">
                        {formData.description || 'Save up to 30% on solar installation. Fill out the form to get a quick estimate.'}
                      </p>
                      
                      {/* Form Fields */}
                      <div className="space-y-2 mb-4">
                        {formData.selectedFields.slice(0, 4).map((field, index) => (
                          <div key={index} className="w-full h-6 bg-gray-100 rounded flex items-center px-2">
                            <span className="text-xs text-gray-500">{field}</span>
                          </div>
                        ))}
                        {formData.customQuestions.slice(0, 2).map((question, index) => (
                          <div key={`custom-${index}`} className="w-full h-6 bg-gray-100 rounded flex items-center px-2">
                            <span className="text-xs text-gray-500">{question?.question || 'Custom question'}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Submit Button */}
                      <div className="mt-auto">
                        <div className="w-full h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                          {formData.cta}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            <div className="mt-4 space-y-2">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
