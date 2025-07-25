"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseHybridClient } from '@/lib/supabase/hybrid-client'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true) // Start with true for initial loading
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()

  // Use hybrid client that works with existing database
  const supabase = createSupabaseHybridClient()

  // Check session using custom API that returns Supabase-compatible data
  const checkSession = async () => {
    try {
      console.log('[AuthContext] Checking session...')
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok && data.user) {
        console.log('[AuthContext] Session valid:', data.user.email)
        setUser(data.user)
        setIsAdmin(data.user.is_admin || false)

        // Also set the Supabase session context if tokens are available
        if (data.supabaseToken) {
          await supabase.auth.setSession({
            access_token: data.supabaseToken,
            refresh_token: data.refreshToken || data.supabaseToken
          })
        }
      } else {
        console.log('[AuthContext] No valid session')
        setUser(null)
        setIsAdmin(false)
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error('[AuthContext] Session check error:', error)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
      setSessionChecked(true)
    }
  }

  // Google Sign In (redirect to custom endpoint)
  const signIn = async () => {
    try {
      console.log('[AuthContext] Starting Google OAuth sign in...')
      window.location.href = '/api/auth/google/signin'
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error)
      throw error
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...')
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })

      setUser(null)
      setIsAdmin(false)
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error)
    }
  }

  const logout = signOut

  useEffect(() => {
    console.log('[AuthContext] Initializing AuthContext...')

    let didSet = false
    const timeout = setTimeout(() => {
      if (!didSet) {
        setSessionChecked(true)
        setLoading(false)
        console.warn('AuthContext: Forced sessionChecked=true due to timeout')
      }
    }, 5000)

    const initializeAuth = async () => {
      await checkSession()
      didSet = true
      clearTimeout(timeout)
    }

    initializeAuth()

    // Periodically check session every 5 minutes
    const interval = setInterval(() => {
      console.log('[AuthContext] Periodic session check...')
      checkSession()
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  // Handle window focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('[AuthContext] Window focused, checking session...')
      checkSession()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const value = {
    user,
    isAdmin,
    loading,
    sessionChecked,
    isLoggedIn: !!user,
    signIn,
    signOut,
    logout,
    checkSession,
    supabase, // Keep this for backward compatibility with existing code
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
