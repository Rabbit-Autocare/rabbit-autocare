import { createMiddlewareClient } from '@/lib/supabase/index';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();

  // Use the createMiddlewareClient function from our shared index file
  const supabase = createMiddlewareClient(req, res);

  // --- START DEBUGGING LOGS ---
  //   console.log('Middleware Path:', req.nextUrl.pathname);
  //   console.log('Middleware Request Headers (Cookie):', req.headers.get('cookie'));
  // --- END DEBUGGING LOGS ---

  // Refresh session if expired - required for Server Components
  // This call will also update the session cookies in the response
  const {
    data: { session: initialSession },
    error: initialSessionError,
  } = await supabase.auth.getSession();

  // --- START DEBUGGING LOGS ---
  //   console.log('Middleware Initial Session:', initialSession);
  //   console.log('Middleware Initial Session Error:', initialSessionError);
  // --- END DEBUGGING LOGS ---

  // Admin protection logic
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // --- START DEBUGGING LOGS (specific to admin path) ---
    // console.log('Middleware Admin Path Session (after second getSession):', session);
    // console.log('Middleware Admin Path Session Error (after second getSession):', sessionError);
    // --- END DEBUGGING LOGS ---

    // If no session, redirect to login
    if (!session) {
      const redirectRes = NextResponse.redirect(new URL('/login', req.url));
      redirectRes.headers.set(
        'x-middleware-debug',
        'No-Session-Redirecting-to-Login'
      );
      return redirectRes;
    }

    // Fetch user role from auth_users table
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    // Handle error fetching user data
    if (userError) {
      const redirectRes = NextResponse.redirect(
        new URL('/login?error=auth_data_error', req.url)
      );
      redirectRes.headers.set(
        'x-middleware-debug',
        'User-Data-Fetch-Error-Redirecting-to-Login'
      );
      return redirectRes;
    }

    // If user is not admin, redirect to home
    if (!userData?.is_admin) {
      const redirectRes = NextResponse.redirect(new URL('/', req.url));
      redirectRes.headers.set(
        'x-middleware-debug',
        'Not-Admin-Redirecting-to-Home'
      );
      return redirectRes;
    }

    // If admin, allow access
    res.headers.set('x-middleware-debug', 'Admin-Access-Granted');
  }

  return res;
}

// Only run middleware on specified routes
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/cart/:path*',
    '/admin/:path*',
  ],
};
