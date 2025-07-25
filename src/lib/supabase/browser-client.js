import { createClient } from '@supabase/supabase-js';

// Custom storage adapter to inject your custom sessions
class CustomStorageAdapter {
  constructor() {
    this.storage = new Map();
  }

  async getItem(key) {
    if (key === 'sb-access-token' || key === 'sb-refresh-token') {
      // Get your custom session
      try {
        const response = await fetch('/api/auth/supabase-session');
        if (response.ok) {
          const { supabaseSession } = await response.json();
          if (supabaseSession && key === 'sb-access-token') {
            return supabaseSession.access_token;
          }
          if (supabaseSession && key === 'sb-refresh-token') {
            return supabaseSession.refresh_token;
          }
        }
      } catch (error) {
        console.error('Error getting custom session:', error);
      }
    }
    return this.storage.get(key) || null;
  }

  async setItem(key, value) {
    this.storage.set(key, value);
  }

  async removeItem(key) {
    this.storage.delete(key);
  }
}

export function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        storage: new CustomStorageAdapter(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );
}
