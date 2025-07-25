// Re-export the clients for easy importing
export { createSupabaseBrowserClient } from './browser-client';
export { createSupabaseServerClient } from './server-client';

// For backward compatibility - only create browser client on client side
export const supabase = typeof window !== 'undefined' 
  ? (() => {
      try {
        const { createSupabaseBrowserClient } = require('./browser-client');
        return createSupabaseBrowserClient();
      } catch (error) {
        console.warn('Failed to create browser client:', error);
        return null;
      }
    })()
  : null;
