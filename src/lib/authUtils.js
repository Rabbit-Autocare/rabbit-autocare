// lib/authUtils.js
import { supabase } from '@/lib/supabaseClient';

// Simple function to get current user and their data
export async function getCurrentUser() {
  try {
    // Get the current session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, userData: null, error: 'Not authenticated' };
    }

    // Get user data from auth_users table (same as your admin approach)
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return { user, userData: null, error: 'Failed to fetch user data' };
    }

    // Check if user is banned
    if (userData?.is_banned === true) {
      return { user: null, userData: null, error: 'User is banned' };
    }

    return { user, userData, error: null };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { user: null, userData: null, error: error.message };
  }
}

// Function to check if user is authenticated (for API routes)
export async function authenticateUser(request) {
  try {
    // Get authorization header or check for session
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If using bearer token approach
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { user: null, userData: null, error: 'Invalid token' };
      }

      return await getUserData(user);
    } else {
      // Fallback to session-based auth
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { user: null, userData: null, error: 'Not authenticated' };
      }

      return await getUserData(user);
    }
  } catch (error) {
    return { user: null, userData: null, error: error.message };
  }
}

// Helper function to get user data
async function getUserData(user) {
  const { data: userData, error: userError } = await supabase
    .from('auth_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError) {
    return { user, userData: null, error: 'Failed to fetch user data' };
  }

  if (userData?.is_banned === true) {
    return { user: null, userData: null, error: 'User is banned' };
  }

  return { user, userData, error: null };
}
