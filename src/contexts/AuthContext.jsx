"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false) // Start with false to allow initial render
  const [sessionChecked, setSessionChecked] = useState(false)

  // Initialize supabase client immediately
  const supabase = createSupabaseBrowserClient()

  // Store session in localStorage for convenience
  const storeSession = (session) => {
    if (session) {
      localStorage.setItem('supabase.session', JSON.stringify(session));
    } else {
      localStorage.removeItem('supabase.session');
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing AuthContext...')
    setLoading(true) // Set loading to true when starting session check
    let didSet = false;
    const timeout = setTimeout(() => {
      if (!didSet) {
        setSessionChecked(true);
        setLoading(false);
        console.warn('AuthContext: Forced sessionChecked=true due to timeout')
      }
    }, 5000);

    // Check initial session immediately
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthContext] Initial session check:', { session: !!session, user: session?.user?.email, error })
        storeSession(session);

        if (session?.user) {
          await checkUserRole(session.user)
        } else {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          setSessionChecked(true)
          didSet = true;
        }
      } catch (error) {
        console.error('[AuthContext] Error checking initial session:', error)
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        setSessionChecked(true)
        didSet = true;
      }
    }

    // Add a small delay to prevent blocking initial render
    const timer = setTimeout(() => {
      checkInitialSession()
    }, 100)

    // onAuthStateChange is the single source of truth.
    // It fires with INITIAL_SESSION on load, SIGNED_IN after login, TOKEN_REFRESH on refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] onAuthStateChange event: ${event}`);
      console.log(`[AuthContext] Session user:`, session?.user?.email);
      storeSession(session);

      if (session?.user) {
        await checkUserRole(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        setSessionChecked(true);
        didSet = true;
      }
    });

    // Periodically check session every 5 minutes
    const interval = setInterval(async () => {
      try {
        console.log('[AuthContext] Periodic session check...');
        const { data: { session }, error } = await supabase.auth.getSession();
        storeSession(session);
        if (session?.user) {
          await checkUserRole(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setSessionChecked(true);
          didSet = true;
        }
      } catch (error) {
        console.error('[AuthContext] Error in periodic session check:', error);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        setSessionChecked(true);
        didSet = true;
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearTimeout(timer)
      clearTimeout(timeout)
      subscription?.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase])

  useEffect(() => {
    const handleFocus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        storeSession(session);
      } catch (e) {
        console.error('[AuthContext] Error refreshing session on focus:', e);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [supabase]);

  useEffect(() => {
    console.log('[AuthContext] sessionChecked:', sessionChecked, 'user:', user);
  }, [sessionChecked, user]);

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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'email profile',
        }
      });
      if (error) throw error;
      
      // Store sign-in attempt in localStorage
      localStorage.setItem('auth_in_progress', 'true');
      localStorage.setItem('auth_start_time', Date.now().toString());
      
      return data;
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error);
      throw error;
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
