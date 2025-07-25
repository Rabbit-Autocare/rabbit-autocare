// Re-export the clients for easy importing
export { createSupabaseBrowserClient } from './browser-client';
export { createSupabaseServerClient } from './server-client';

// For backward compatibility, you can also export a default client
export const supabase = createSupabaseBrowserClient();
