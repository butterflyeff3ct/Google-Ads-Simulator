'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Script from 'next/script'

export default function DialogflowChatbot() {
  const { data: session, status } = useSession()
  const [chatKey, setChatKey] = useState<string>('')
  const [showChatbot, setShowChatbot] = useState<boolean>(true)

  useEffect(() => {
    // Generate a unique key on component mount to force fresh chatbot on each page load
    setChatKey(`chatbot-${Date.now()}`)
  }, [])

  const handleReset = () => {
    // Step 1: Unmount the chatbot completely
    setShowChatbot(false)
    
    // Step 2: Clear any Dialogflow stored data in localStorage/sessionStorage
    try {
      // Clear any df-messenger related storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('df-') || key.includes('dialogflow')) {
          sessionStorage.removeItem(key)
        }
      })
      Object.keys(localStorage).forEach(key => {
        if (key.includes('df-') || key.includes('dialogflow')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('Could not clear storage:', e)
    }
    
    // Step 3: After a short delay, remount with new key
    setTimeout(() => {
      setChatKey(`chatbot-${Date.now()}`)
      setShowChatbot(true)
    }, 100)
  }

  // Don't show chatbot if user is not logged in
  if (!chatKey || !session) return null

  return (
    <>
      {/* Dialogflow Chatbot Stylesheet */}
      <link
        rel="stylesheet"
        href="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css"
      />
      
      {/* Dialogflow Chatbot Script */}
      <Script
        src="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js"
        strategy="lazyOnload"
      />
      
      {/* Dialogflow Messenger Component with unique key */}
      {showChatbot && (
        <>
          <df-messenger
            key={chatKey}
            location="us-central1"
            project-id="ads-chatbot-473216"
            agent-id="a01ce77b-6486-4ca0-b698-60fd5dc3dc43"
            language-code="en"
            max-query-length="-1">
            <df-messenger-chat-bubble
              chat-title="Adsbot">
            </df-messenger-chat-bubble>
          </df-messenger>

          {/* Reset Button - positioned to appear inside chat window */}
          <button
            onClick={handleReset}
            className="chatbot-reset-button"
            title="Reset Chat"
            aria-label="Reset chatbot conversation"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </>
      )}

      {/* Chatbot Styling */}
      <style jsx global>{`
        df-messenger {
          z-index: 999;
          position: fixed;
          --df-messenger-font-color: #000;
          --df-messenger-font-family: Google Sans;
          --df-messenger-chat-background: #f3f6fc;
          --df-messenger-message-user-background: #d3e3fd;
          --df-messenger-message-bot-background: #fff;
          bottom: 16px;
          right: 16px;
        }

        .chatbot-reset-button {
          position: fixed;
          bottom: 660px;
          right: 24px;
          z-index: 1001;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
          opacity: 0.9;
        }

        .chatbot-reset-button:hover {
          transform: scale(1.1) rotate(180deg);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
          opacity: 1;
        }

        .chatbot-reset-button:active {
          transform: scale(0.95) rotate(180deg);
        }

        .chatbot-reset-button svg {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        /* Adjust reset button position when chat is expanded */
        df-messenger[opened="true"] ~ .chatbot-reset-button {
          bottom: 660px;
        }

        /* Hide button when chat is minimized */
        df-messenger:not([opened="true"]) ~ .chatbot-reset-button {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </>
  )
}

