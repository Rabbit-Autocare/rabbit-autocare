import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

/**
 * Middleware for handling authentication and route protection
 * This middleware runs on every request and:
 * 1. Checks if the user is authenticated
 * 2. Protects routes based on authentication status
 * 3. Handles admin-only routes
 */
export async function middleware(req) {
  console.log('🔒 Middleware processing request:', req.nextUrl.pathname)

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback', '/', '/about', '/products', '/blog', '/contact']
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // If no session and trying to access protected route
    if (!session && !isPublicRoute) {
      console.log('❌ No session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If session exists and trying to access login page
    if (session && req.nextUrl.pathname === '/login') {
      console.log('✅ Session exists, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        console.log('❌ No session for admin route, redirecting to login')
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Check if user is admin
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (error || !userData?.is_admin) {
        console.log('❌ User is not admin, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      console.log('✅ Admin access granted')
    }

    return res
  } catch (error) {
    console.error('❌ Middleware error:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
