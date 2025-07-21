import { createBrowserClient } from '@supabase/ssr';

let supabaseClient = null;

function storeSessionInLocalStorage(session) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (session) {
      localStorage.setItem('supabase.session', JSON.stringify(session));
      console.log('[Supabase] Session stored in localStorage.');
    } else {
      localStorage.removeItem('supabase.session');
      console.log('[Supabase] Session removed from localStorage.');
    }
  }
}

export function getSessionFromLocalStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const sessionStr = localStorage.getItem('supabase.session');
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {
      console.warn('[Supabase] Failed to parse session from localStorage:', e);
    }
  }
  return null;
}

export function createSupabaseBrowserClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'rabbit-auto-cars',
        },
      },
    });
    // On client creation, try to store the current session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      storeSessionInLocalStorage(session);
    });
    // Listen for session changes and always store in localStorage
    supabaseClient.auth.onAuthStateChange((event, session) => {
      storeSessionInLocalStorage(session);
    });
    console.log('[Supabase] Supabase client created and session monitoring enabled.');
  }
  return supabaseClient;
}
