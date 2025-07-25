import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Custom storage adapter to inject our sessions
class CustomStorageAdapter {
  constructor() {
    this.storage = new Map()
  }

  async getItem(key) {
    if (key === 'sb-access-token' || key === 'sb-refresh-token') {
      // Get our custom session
      try {
        const response = await fetch('/api/auth/supabase-session')
        if (response.ok) {
          const { supabaseSession } = await response.json()
          if (supabaseSession && key === 'sb-access-token') {
            return supabaseSession.access_token
          }
          if (supabaseSession && key === 'sb-refresh-token') {
            return supabaseSession.refresh_token
          }
        }
      } catch (error) {
        console.error('Error getting custom session:', error)
      }
    }
    return this.storage.get(key) || null
  }

  async setItem(key, value) {
    this.storage.set(key, value)
  }

  async removeItem(key) {
    this.storage.delete(key)
  }
}

// Client that works with your existing database structure
export const createSupabaseHybridClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: new CustomStorageAdapter(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  })
}
