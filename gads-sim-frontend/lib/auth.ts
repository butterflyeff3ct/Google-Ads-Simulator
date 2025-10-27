import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

// Admin email configuration from environment variables
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0)

function isAdminEmail(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For now, we'll create a simple user object
        // In a real app, you'd validate against a database
        const user = {
          id: `user-${Date.now()}`,
          name: credentials.name || 'User',
          email: credentials.email,
          image: null,
        }

        // Store user in Google Sheets
        try {
          await storeUserInSheets({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: 'credentials',
          })
        } catch (error) {
          console.error('Error storing user in sheets:', error)
          // Don't block sign-in if sheets storage fails
        }

        return user
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user exists in User List before allowing login
      if (account?.provider === 'google') {
        try {
          const userExists = await checkUserExists({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: account.provider,
          })

          if (!userExists) {
            console.log('User not found in User List - blocking login')
            return false // Block login if user doesn't exist
          }

          // User exists, proceed with login and store activity
          await storeUserInSheets({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: account.provider,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
          })
        } catch (error) {
          console.error('Error checking user existence:', error)
          return false // Block login if check fails
        }
      }
      // For credentials provider, user is already stored in the authorize function
      return true
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        // Add admin role based on email
        token.role = isAdminEmail(user.email) ? 'admin' : 'user'
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.role = token.role as string
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
}

// Function to check if user exists before login
async function checkUserExists(userData: any): Promise<boolean> {
  console.log('Checking if user exists:', userData);
  
  try {
    // Use backend URL - works from both server and client side in localhost
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/check-user-exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userData.id.length >= 6 ? userData.id.slice(-6) : userData.id.padStart(6, '0'),
        email: userData.email,
        name: userData.name,
        provider: userData.provider,
        profile_pic: userData.image,
        is_first_login: true
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to check user existence:', response.status, errorText)
      // If backend is unreachable, check if email is in admin list to allow admin access
      if (isAdminEmail(userData.email)) {
        console.log('Backend unreachable but user is admin - allowing login')
        return true
      }
      return false // Default to false if check fails
    }
    
    const result = await response.json()
    console.log('User existence check result:', result)
    return result.exists
  } catch (error) {
    console.error('Error checking user existence:', error)
    // If backend is unreachable, check if email is in admin list to allow admin access
    if (isAdminEmail(userData.email)) {
      console.log('Backend unreachable but user is admin - allowing login')
      return true
    }
    return false // Default to false if check fails
  }
}

// Function to store user data in SQL Server
async function storeUserInSheets(userData: any) {
  console.log('Attempting to store user data:', userData);
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    // Use the new user tracking endpoint
    const response = await fetch(`${backendUrl}/api/log-user-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userData.id.length >= 6 ? userData.id.slice(-6) : userData.id.padStart(6, '0'),
        email: userData.email,
        name: userData.name,
        provider: userData.provider,
        profile_pic: userData.image,
        is_first_login: true // Backend will detect if user exists and handle accordingly
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to store user data:', response.status, errorText)
      // Don't throw error if backend is unreachable - allow login to proceed
      return
    }
    
    const result = await response.json()
    console.log('User data storage result:', result)
  } catch (error) {
    console.error('Error storing user data:', error)
    // Don't throw error if backend is unreachable - allow login to proceed
  }
}
