'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

/**
 * AuthProvider Component
 * Manages authentication state and provides auth-related functions
 * Handles:
 * - Session management
 * - User data fetching
 * - Google OAuth sign-in
 * - Sign out
 * - Admin status checking
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth state...')

        // Get initial session with retry
        let session = null
        let retries = 0
        while (!session && retries < 5) {
          try {
            console.log(`🔄 Attempting to get initial session (attempt ${retries + 1}/5)...`)
            const { data: { session: currentSession }, error } = await supabase.auth.getSession()

            if (currentSession) {
              session = currentSession
              console.log('✅ Initial session found:', currentSession.user.email)
              break
            }

            if (error) {
              console.error(`❌ Error getting initial session (attempt ${retries + 1}):`, error)
            } else {
              console.log(`ℹ️ No initial session found (attempt ${retries + 1})`)
            }
          } catch (err) {
            console.error(`❌ Unexpected error getting initial session (attempt ${retries + 1}):`, err)
          }

          retries++
          if (retries < 5) {
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
        }

        if (session && mounted) {
          setUser(session.user)
          await fetchUserData(session.user.id)
        } else {
          console.log('ℹ️ No active session after initialization')
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session && mounted) {
          console.log('✅ New session established:', session.user.email)
          setUser(session.user)
          await fetchUserData(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          console.log('ℹ️ Session ended')
          setUser(null)
          setUserData(null)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserData = async (userId) => {
    try {
      console.log('🔄 Fetching user data for:', userId)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching user data:', error)
        return
      }

      console.log('✅ User data fetched:', data)
      setUserData(data)
    } catch (error) {
      console.error('❌ Unexpected error fetching user data:', error)
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Initiating Google sign in...')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error('❌ Google sign in error:', error)
        throw error
      }

      console.log('✅ Google sign in initiated')
    } catch (error) {
      console.error('❌ Unexpected error during Google sign in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
        throw error
      }

      setUser(null)
      setUserData(null)
      console.log('✅ Signed out successfully')
      router.push('/login')
    } catch (error) {
      console.error('❌ Unexpected error during sign out:', error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    initialized,
    signInWithGoogle,
    signOut,
    isAdmin: userData?.is_admin || false,
  }

  // Don't render children until initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
