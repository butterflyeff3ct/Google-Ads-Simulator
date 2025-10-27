'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface ActivityTrackerProps {
  children: React.ReactNode
}

export default function ActivityTracker({ children }: ActivityTrackerProps) {
  const { data: session } = useSession()
  const [sessionId, setSessionId] = useState<string>('')
  const pageViewsRef = useRef(0)
  const actionsRef = useRef<string[]>([])
  const lastActivityRef = useRef<Date>(new Date())
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize session when user logs in
  useEffect(() => {
    if (!session?.user) return

    // Get or create session ID from sessionStorage
    let storedSessionId = sessionStorage.getItem('user_session_id')
    
    if (!storedSessionId) {
      const userId = session.user.id || session.user.email || ''
      const user_id_6digit = userId.length >= 6 ? userId.slice(-6) : userId.padStart(6, '0')
      storedSessionId = `sess-${user_id_6digit}-${Date.now()}`
      sessionStorage.setItem('user_session_id', storedSessionId)
    }
    
    setSessionId(storedSessionId)
  }, [session])

  // Heartbeat to keep session alive
  useEffect(() => {
    if (!session?.user || !sessionId) return

    const sendHeartbeat = async () => {
      try {
        pageViewsRef.current += 1
        lastActivityRef.current = new Date()

        const userId = session.user.id || session.user.email || ''
        const user_id_6digit = userId.length >= 6 ? userId.slice(-6) : userId.padStart(6, '0')
        
        // Send heartbeat to update last_activity
        await fetch('http://localhost:8000/api/update-user-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            page_views: pageViewsRef.current,
            actions_taken: actionsRef.current,
            status: 'active'
          }),
        })
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Send heartbeat every 2 minutes to keep session alive
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 120000) // 2 minutes

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [session, sessionId])

  // Track user activity
  const trackActivity = (action: string) => {
    if (!session?.user || !sessionId) return
    actionsRef.current.push(action)
    lastActivityRef.current = new Date()
  }

  // Track user interactions
  useEffect(() => {
    if (!session?.user || !sessionId) return

    // Track page navigation
    const handlePageChange = () => {
      trackActivity('page_view')
    }

    // Track clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        trackActivity(`click_${target.tagName.toLowerCase()}`)
      }
    }

    // Track form submissions
    const handleSubmit = (event: Event) => {
      trackActivity('form_submit')
    }

    // Add event listeners
    window.addEventListener('beforeunload', handlePageChange)
    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleSubmit)

    // Track initial page load
    trackActivity('page_load')

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handlePageChange)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleSubmit)
    }
  }, [session, sessionId])

  return <>{children}</>
}
