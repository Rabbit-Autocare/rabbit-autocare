import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request) {
  // Get the supabase token from cookies
  const supabaseToken = request.cookies.get('supabase-token')?.value

  if (supabaseToken) {
    try {
      // Verify the token is valid
      jwt.verify(supabaseToken, process.env.SUPABASE_JWT_SECRET)

      // Add Authorization header to the request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('Authorization', `Bearer ${supabaseToken}`)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Invalid token:', error.message)
      // Token is invalid, continue without auth
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/user/:path*'
  ]
}
