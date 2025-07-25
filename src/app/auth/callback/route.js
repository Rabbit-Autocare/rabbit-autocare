import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  // Handle OAuth errors
  if (error) {
    console.error('[AUTH CALLBACK] OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${error_description}`, request.url)
    );
  }
  if (!code) {
    console.error('[AUTH CALLBACK] No code provided');
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    // Exchange code for session with timeout
    const sessionPromise = supabase.auth.exchangeCodeForSession(code);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session exchange timeout')), 10000)
    );
    const { data, error: sessionError } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]);
    if (sessionError) {
      console.error('[AUTH CALLBACK] Session exchange error:', sessionError);
      return NextResponse.redirect(new URL('/login?error=session_error', request.url));
      }
      console.log('[AUTH CALLBACK] Session established successfully:', data.session?.user?.email);
    // Get user data with timeout
    const userPromise = supabase
        .from('auth_users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

    const { data: userData, error: userError } = await Promise.race([
      userPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('User data fetch timeout')), 5000))
    ]);
      if (userError && userError.code !== 'PGRST116') {
        console.error('[AUTH CALLBACK] Error fetching user data:', userError);
        return NextResponse.redirect(new URL('/login?error=user_data_error', request.url));
      }
    // Create new user if doesn't exist
      if (!userData) {
      const { error: createError } = await supabase
          .from('auth_users')
          .insert({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
            is_admin: false,
            is_banned: false,
            phone_number: null,
        });
        if (createError) {
          console.error('[AUTH CALLBACK] Error creating user:', createError);
          return NextResponse.redirect(new URL('/login?error=user_creation_error', request.url));
        }
        return NextResponse.redirect(new URL('/user', request.url));
      }
      if (userData.is_banned) {
        console.error('[AUTH CALLBACK] User is banned:', userData.email);
        return NextResponse.redirect(new URL('/login?error=user_banned', request.url));
      }
    // Redirect based on role
      const redirectUrl = userData.is_admin ? '/admin' : '/user';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error:', error);
      return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url));
    }
  }
//https://rabbit-auto-care.vercel.app/auth/callback