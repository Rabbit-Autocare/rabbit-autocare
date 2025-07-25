import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      console.log('[AUTH CALLBACK] Processing OAuth callback with code:', code)

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[AUTH CALLBACK] Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=auth_error', request.url))
      }

      console.log('[AUTH CALLBACK] Session established successfully:', data.session?.user?.email)

      // Get user data to determine redirect
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('[AUTH CALLBACK] Error fetching user data:', userError)
        return NextResponse.redirect(new URL('/login?error=user_data_error', request.url))
      }

      // If user doesn't exist, create them
      if (!userData) {
        console.log('[AUTH CALLBACK] Creating new user...')
        const { data: newUser, error: createError } = await supabase
          .from('auth_users')
          .insert({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
            is_admin: false,
            is_banned: false,
            phone_number: null
          })
          .select()
          .single()

        if (createError) {
          console.error('[AUTH CALLBACK] Error creating user:', createError)
          return NextResponse.redirect(new URL('/login?error=user_creation_error', request.url))
        }

        console.log('[AUTH CALLBACK] New user created:', newUser)
        return NextResponse.redirect(new URL('/user', request.url))
      }

      // Check if user is banned
      if (userData.is_banned) {
        console.error('[AUTH CALLBACK] User is banned:', userData.email)
        return NextResponse.redirect(new URL('/login?error=user_banned', request.url))
      }

      // Redirect based on admin status
      const redirectUrl = userData.is_admin ? '/admin' : '/user'
      console.log('[AUTH CALLBACK] Redirecting to:', redirectUrl)

      return NextResponse.redirect(new URL(redirectUrl, request.url))

    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error:', error)
      return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
    }
  }

  // If no code, redirect to login
  console.log('[AUTH CALLBACK] No code provided, redirecting to login')
  return NextResponse.redirect(new URL('/login', request.url))
}
