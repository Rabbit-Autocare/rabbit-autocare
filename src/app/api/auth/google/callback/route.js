import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  console.log('OAuth callback received:', { code: !!code, error })

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_error&details=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
  }

  try {
    console.log('Exchanging code for tokens...')

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
      }),
    })

    const tokens = await tokenResponse.json()
    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`)
    }

    if (!tokens.access_token) {
      console.error('No access token received:', tokens)
      return NextResponse.redirect(`${baseUrl}/login?error=no_access_token`)
    }

    console.log('Getting user info from Google...')

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()
    console.log('Google user info:', { email: googleUser.email, name: googleUser.name })

    if (!googleUser.email) {
      console.error('No email in Google user response')
      return NextResponse.redirect(`${baseUrl}/login?error=no_email`)
    }

    // Work with your existing auth_users table structure
    const supabase = createSupabaseServerClient()

    console.log('Checking if user exists in database...')

    // Check if user exists in your current table
    const { data: existingUser, error: fetchError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', googleUser.email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error:', fetchError)
      return NextResponse.redirect(`${baseUrl}/login?error=database_error`)
    }

    let user

    if (existingUser) {
      console.log('User exists, updating...')

      // Check if user is banned
      if (existingUser.is_banned) {
        console.log('User is banned')
        return NextResponse.redirect(`${baseUrl}/login?error=account_banned`)
      }

      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('auth_users')
        .update({
          name: googleUser.name || existingUser.name,
          picture: googleUser.picture,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.redirect(`${baseUrl}/login?error=update_failed`)
      }

      user = updatedUser
    } else {
      console.log('Creating new user...')

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('auth_users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          is_admin: false,
          is_banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.redirect(`${baseUrl}/login?error=create_failed`)
      }

      user = newUser
    }

    console.log('Creating JWT tokens...')

    // Create custom JWT token for your app
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin: user.is_admin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )


   // Create Supabase-compatible JWT token with correct structure
const supabaseCompatibleToken = jwt.sign(
  {
    aud: 'authenticated',
    // exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // ❌ Remove this line
    iat: Math.floor(Date.now() / 1000),
    iss: 'supabase',
    sub: user.id,
    email: user.email,
    phone: '',
    app_metadata: {
      provider: 'google',
      providers: ['google']
    },
    user_metadata: {
      email: user.email,
      name: user.name,
      picture: user.picture,
      is_admin: user.is_admin || false
    },
    role: 'authenticated',
    email_verified: true,
    session_id: `${user.id}-${Date.now()}`
  },
  process.env.SUPABASE_JWT_SECRET,
  {
    algorithm: 'HS256',
    expiresIn: '7d'  // ✅ Keep this - it will automatically set the exp claim
  }
)


    // Determine redirect URL based on user role
    const redirectUrl = user.is_admin ? `${baseUrl}/admin` : `${baseUrl}/user`

    console.log('Authentication successful, redirecting to:', redirectUrl)

    // Set cookies and redirect
    const response = NextResponse.redirect(redirectUrl)

    // Your custom app token
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    // Supabase-compatible token for RLS
    response.cookies.set('supabase-token', supabaseCompatibleToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=callback_error&message=${encodeURIComponent(error.message)}`)
  }
}
