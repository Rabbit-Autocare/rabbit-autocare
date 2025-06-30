"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Initialize supabase client immediately
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    console.log('[AuthContext] Initializing AuthContext...')

    // Check initial session immediately
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthContext] Initial session check:', { session: !!session, user: session?.user?.email, error })

        if (session?.user) {
          await checkUserRole(session.user)
        } else {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          setSessionChecked(true)
        }
      } catch (error) {
        console.error('[AuthContext] Error checking initial session:', error)
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        setSessionChecked(true)
      }
    }

    checkInitialSession()

    // onAuthStateChange is the single source of truth.
    // It fires with INITIAL_SESSION on load, and SIGNED_IN after login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] onAuthStateChange event: ${event}`);
      console.log(`[AuthContext] Session user:`, session?.user?.email);
      console.log(`[AuthContext] Session data:`, session);

      if (session?.user) {
        await checkUserRole(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        setSessionChecked(true);
      }
    });

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const checkUserRole = async (user) => {
    console.log(`[AuthContext] Checking profile for user: ${user.id}`);
    try {
      // Get all user data from auth_users table
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log(`[AuthContext] Profile data fetched:`, { data, error });

      if (error) throw error

      // Merge auth user data with auth_users table data
      setUser({ ...user, ...data })
      setIsAdmin(data?.is_admin || false)
    } catch (error) {
      console.error('[AuthContext] Error checking user role:', error)
      // Set the user from the session even if profile lookup fails
      setUser(user)
      setIsAdmin(false)
    } finally {
      // This is the correct place to set loading to false.
      setLoading(false);
      setSessionChecked(true);
    }
  }

  const signIn = async () => {
    try {
      console.log('[AuthContext] Starting Google OAuth sign in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use the auth callback route
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setIsAdmin(false)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    isAdmin,
    loading,
    sessionChecked,
    supabase, // Expose supabase client
    signIn,
    signOut
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
