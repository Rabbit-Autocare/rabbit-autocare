import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabaseToken = request.cookies.get('supabase-token')?.value

    if (!supabaseToken) {
      return NextResponse.json({ supabaseSession: null }, { status: 401 })
    }

    // Return the token in Supabase session format
    return NextResponse.json({
      supabaseSession: {
        access_token: supabaseToken,
        refresh_token: supabaseToken,
        expires_in: 604800, // 7 days
        token_type: 'bearer'
      }
    })

  } catch (error) {
    console.error('Supabase session error:', error)
    return NextResponse.json({ supabaseSession: null }, { status: 401 })
  }
}
