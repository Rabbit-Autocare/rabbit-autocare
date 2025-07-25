// Re-export the clients for easy importing
export { createSupabaseBrowserClient } from './browser-client';
export { createSupabaseServerClient } from './server-client';

// Remove this line completely - it's causing the error
// export const supabase = createSupabaseBrowser();
