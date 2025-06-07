import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Create a response object
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  // Optional: Add session info to response headers for debugging
  if (session) {
    res.headers.set('x-user-id', session.user.id)
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
    matcher: [
      '/api/:path*',
      '/dashboard/:path*',
      '/profile/:path*',
      '/cart/:path*'
    ]
  }
