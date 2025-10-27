'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AccessRequest {
  id: string
  name: string
  email: string
  company: string
  role: string
  useCase: string
  experience: string
  message: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  approved_at?: string
  rejected_at?: string
}

interface User {
  user_id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended' | 'online'
  signup_timestamp: string
  first_login?: string
  last_login?: string
  approval_date?: string
  added_by: string
  notes?: string
  profile_pic?: string
}

interface RejectedUser {
  user_id: string
  email: string
  name: string
  company: string
  role: string
  use_case: string
  experience: string
  message: string
  rejection_date: string
  rejected_by: string
  rejection_reason: string
}

interface UserActivity {
  user_id: string
  email: string
  session_id: string
  login_time: string
  logout_time?: string
  status: 'active' | 'expired' | 'logged_out'
  duration_mins: number
  page_views: number
  actions_taken: string[]
  ip_address: string
  last_activity: string
  idle_timeout: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [rejectedUsers, setRejectedUsers] = useState<RejectedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('access-requests')
  
  // Pre-approval form state
  const [showPreApprovalForm, setShowPreApprovalForm] = useState(false)
  const [preApprovalData, setPreApprovalData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    notes: ''
  })
  const [isSubmittingPreApproval, setIsSubmittingPreApproval] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return

    if (session && session.user?.role === 'admin') {
      fetchAccessRequests()
      fetchUsers()
      fetchUserActivities()
      fetchRejectedUsers()
    }
  }, [session, status])

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    if (session?.user?.role !== 'admin') return

    const intervalId = setInterval(() => {
      fetchUsers()
      fetchUserActivities()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(intervalId)
  }, [session])

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/access-requests')
      if (!response.ok) throw new Error('Failed to fetch access requests')
      const data = await response.json()
      const normalized: AccessRequest[] = (data.requests || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        company: r.company || '',
        role: r.role || '',
        useCase: r.reason || '',
        experience: '',
        message: r.message || r.notes || '',
        status: r.status,
        submitted_at: r.requested_at || '',
        approved_at: r.status === 'approved' ? r.reviewed_at : undefined,
        rejected_at: r.status === 'rejected' ? r.reviewed_at : undefined,
        timestamp: r.requested_at || ''
      }))
      setAccessRequests(normalized)
    } catch (err) {
      setError('Failed to load access requests')
      console.error('Error fetching access requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch real data from Google Sheets
      const response = await fetch('http://localhost:8000/api/get-user-list')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched users from API:', data.users)
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users, status:', response.status)
        // Fallback to mock data if API fails
        const mockUsers: User[] = [
          {
            user_id: 'user-001',
            email: 'john.doe@example.com',
            name: 'John Doe',
            status: 'active',
            signup_timestamp: '2024-01-15T10:30:00Z',
            first_login: '2024-01-15T11:00:00Z',
            last_login: '2024-01-20T14:30:00Z',
            approval_date: '2024-01-15T10:45:00Z',
            added_by: 'admin',
            notes: 'Marketing manager from tech company',
            profile_pic: 'https://via.placeholder.com/40'
          }
        ]
        setUsers(mockUsers)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      // Set empty array on error
      setUsers([])
    }
  }

  const fetchUserActivities = async () => {
    try {
      // Fetch real data from Google Sheets
      const response = await fetch('http://localhost:8000/api/get-user-activity')
      if (response.ok) {
        const data = await response.json()
        setUserActivities(data.activities || [])
      } else {
        // Fallback to mock data if API fails
        const mockActivities: UserActivity[] = [
          {
            user_id: 'user-001',
            email: 'john.doe@example.com',
            session_id: 'sess-001-20240120',
            login_time: '2024-01-20T09:30:00Z',
            logout_time: '2024-01-20T11:45:00Z',
            status: 'logged_out',
            duration_mins: 135,
            page_views: 23,
            actions_taken: ['login', 'view_campaign', 'create_campaign', 'view_results', 'logout'],
            ip_address: '192.168.1.100',
            last_activity: '2024-01-20T11:44:00Z',
            idle_timeout: 15
          }
        ]
        setUserActivities(mockActivities)
      }
    } catch (err) {
      console.error('Error fetching user activities:', err)
      // Set empty array on error
      setUserActivities([])
    }
  }

  const fetchRejectedUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/rejected-list')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched rejected users from API:', data.rejected_users)
        setRejectedUsers(data.rejected_users || [])
      } else {
        console.error('Failed to fetch rejected users, status:', response.status)
        setRejectedUsers([])
      }
    } catch (err) {
      console.error('Error fetching rejected users:', err)
      setRejectedUsers([])
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      setError('') // Clear any previous errors
      setSuccessMessage('') // Clear any previous success messages
      
      const response = await fetch(`http://localhost:8000/api/access-request/${requestId}/approve`, {
        method: 'PUT'
      })
      if (!response.ok) {
        throw new Error('Failed to approve request')
      }
      const result = await response.json()
      console.log('Approval result:', result)
      setSuccessMessage('✅ Request approved')
      setTimeout(() => setSuccessMessage(''), 5000)
      
      await fetchAccessRequests() // Refresh the list
      await fetchUsers() // Also refresh user list to show new user
    } catch (err) {
      setError('Failed to approve request')
      console.error('Error approving request:', err)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      setError('') // Clear any previous errors
      setSuccessMessage('') // Clear any previous success messages
      
      const response = await fetch(`http://localhost:8000/api/access-request/${requestId}/reject`, {
        method: 'PUT'
      })
      if (!response.ok) {
        throw new Error('Failed to reject request')
      }
      const result = await response.json()
      console.log('Rejection result:', result)
      setSuccessMessage('❌ Request rejected')
      setTimeout(() => setSuccessMessage(''), 5000)
      
      await fetchAccessRequests() // Refresh the list
      await fetchRejectedUsers() // Also refresh rejected users list
    } catch (err) {
      setError('Failed to reject request')
      console.error('Error rejecting request:', err)
    }
  }

  const handlePreApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPreApproval(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('http://localhost:8000/api/add-pre-approved-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preApprovalData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add pre-approved user')
      }

      const result = await response.json()
      console.log('Pre-approval result:', result)
      setSuccessMessage(`✅ ${result.message}`)
      setTimeout(() => setSuccessMessage(''), 5000)

      // Reset form
      setPreApprovalData({
        name: '',
        email: '',
        company: '',
        role: '',
        notes: ''
      })
      setShowPreApprovalForm(false)

      // Refresh user list
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to add pre-approved user')
      console.error('Error adding pre-approved user:', err)
    } finally {
      setIsSubmittingPreApproval(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'online':
        return `${baseClasses} bg-emerald-100 text-emerald-800 animate-pulse`
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'logged_out':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'expired':
        return `${baseClasses} bg-orange-100 text-orange-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    // If it's already in hh:mm:ss format, return as is
    if (dateString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return dateString
    }
    // Otherwise, format as date
    return new Date(dateString).toLocaleDateString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const pendingRequests = accessRequests.filter(req => req.status === 'pending')
  const approvedRequests = accessRequests.filter(req => req.status === 'approved')
  const rejectedRequests = accessRequests.filter(req => req.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage user access requests and system settings</p>
            </div>
                   <div className="flex space-x-3">
                     <button
                       onClick={() => {
                         fetchAccessRequests()
                         fetchUsers()
                         fetchUserActivities()
                         fetchRejectedUsers()
                       }}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                     >
                       Refresh Data
                     </button>
                     <Link
                       href="/"
                       className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                     >
                       Back to App
                     </Link>
                   </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{approvedRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{rejectedRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'user-list', name: 'User List', count: users.length },
                { id: 'user-activity', name: 'User Activity', count: userActivities.length },
                { id: 'access-requests', name: 'Access Requests', count: accessRequests.length },
                { id: 'pre-approval', name: 'Pre Approval', count: 0 },
                { id: 'rejected-list', name: 'Rejected List', count: rejectedUsers.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    } inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'user-list' && 'User List'}
              {activeTab === 'user-activity' && 'User Activity'}
              {activeTab === 'access-requests' && 'Access Requests'}
              {activeTab === 'pre-approval' && 'Pre Approval'}
              {activeTab === 'rejected-list' && 'Rejected List'}
            </h2>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'user-list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signup Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approval Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profile Pic
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.user_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {user.status === 'online' && (
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                            )}
                            <span className={getStatusBadge(user.status)}>
                              {user.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(user.signup_timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.first_login ? (
                            <span className="text-green-600 font-medium">{formatDate(user.first_login)}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not logged in yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.last_login ? (
                            <span className="text-blue-600 font-medium">{formatDate(user.last_login)}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not logged in yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(user.approval_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.added_by}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {user.notes || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.profile_pic ? (
                            <img 
                              src={user.profile_pic} 
                              alt={user.name}
                              className="w-8 h-8 rounded-full border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                              <span className="text-xs text-gray-500 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">No approved users in the database yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'user-activity' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Login Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Logout Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration (mins)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Idle Timeout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userActivities.map((activity, index) => (
                      <tr key={`${activity.session_id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.session_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(activity.login_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(activity.logout_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(activity.status)}>
                            {activity.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.duration_mins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.page_views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {activity.actions_taken.slice(0, 3).map((action, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {action.replace('_', ' ')}
                                </span>
                              ))}
                              {activity.actions_taken.length > 3 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                                  +{activity.actions_taken.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(activity.last_activity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.idle_timeout} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {userActivities.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity data</h3>
                    <p className="mt-1 text-sm text-gray-500">No user activity sessions found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'access-requests' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Use Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accessRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.company || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.role || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.experience || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(request.status)}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.useCase || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {request.message || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <span className="text-green-600 font-medium">
                              ✅ Approved {request.approved_at && new Date(request.approved_at).toLocaleDateString()}
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="text-red-600 font-medium">
                              ❌ Rejected {request.rejected_at && new Date(request.rejected_at).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {accessRequests.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No access requests</h3>
                    <p className="mt-1 text-sm text-gray-500">No user access requests have been submitted yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pre-approval' && (
              <div>
                {!showPreApprovalForm ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Pre Approval</h3>
                    <p className="mt-1 text-sm text-gray-500">Add users directly to the system without requiring them to submit an access request.</p>
                    <div className="mt-6">
                      <button 
                        onClick={() => setShowPreApprovalForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Pre-Approved User
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto py-8">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Add Pre-Approved User</h3>
                      <button
                        onClick={() => {
                          setShowPreApprovalForm(false)
                          setPreApprovalData({
                            name: '',
                            email: '',
                            company: '',
                            role: '',
                            notes: ''
                          })
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handlePreApprovalSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={preApprovalData.name}
                          onChange={(e) => setPreApprovalData({ ...preApprovalData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={preApprovalData.email}
                          onChange={(e) => setPreApprovalData({ ...preApprovalData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="john.doe@example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          id="company"
                          value={preApprovalData.company}
                          onChange={(e) => setPreApprovalData({ ...preApprovalData, company: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Acme Inc."
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          id="role"
                          value={preApprovalData.role}
                          onChange={(e) => setPreApprovalData({ ...preApprovalData, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Marketing Manager"
                        />
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          rows={4}
                          value={preApprovalData.notes}
                          onChange={(e) => setPreApprovalData({ ...preApprovalData, notes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Additional notes about this user..."
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPreApprovalForm(false)
                            setPreApprovalData({
                              name: '',
                              email: '',
                              company: '',
                              role: '',
                              notes: ''
                            })
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingPreApproval}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmittingPreApproval ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Adding User...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Add User
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex">
                        <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">How Pre-Approval Works:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>User is added directly with "active" status</li>
                            <li>User can login immediately without approval process</li>
                            <li>User will appear in the User List tab</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rejected-list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Use Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejection Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejected By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejection Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rejectedUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {user.user_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.company || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.role || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.use_case || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(user.rejection_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.rejected_by}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.rejection_reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rejectedUsers.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No rejected users</h3>
                    <p className="mt-1 text-sm text-gray-500">No users have been rejected yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
