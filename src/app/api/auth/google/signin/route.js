import { NextResponse } from 'next/server'

export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  console.log('Google Client ID:', googleClientId ? 'Set' : 'Missing')
  console.log('Base URL:', baseUrl)

  if (!googleClientId) {
    console.error('GOOGLE_CLIENT_ID is not set')
    return NextResponse.redirect(`${baseUrl}/login?error=config_error`)
  }

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  console.log('Redirecting to Google OAuth:', googleAuthUrl)
  return NextResponse.redirect(googleAuthUrl)
}
