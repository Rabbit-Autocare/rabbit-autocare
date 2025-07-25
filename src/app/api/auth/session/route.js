// app/api/auth/session/route.js
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

export async function GET(request) {
  try {
    console.log('🔍 Session API: Checking cookies...')

    // Await cookies in Next.js 15
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value
    const supabaseToken = cookieStore.get('supabase-token')?.value

    console.log('🍪 Cookies found:', { authToken: !!authToken, supabaseToken: !!supabaseToken })

    if (!authToken || !supabaseToken) {
      return NextResponse.json({ user: null, session: null }, { status: 401 })
    }

    // Verify the custom auth token
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET)

    // Get user data from database
    const supabase = createSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', decodedToken.userId)
      .single()

    if (error || !user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ user: null, session: null }, { status: 401 })
    }

    // Check if user is banned
    if (user.is_banned) {
      return NextResponse.json({ user: null, session: null }, { status: 403 })
    }

    console.log('✅ Session verified for user:', user.email)

    // Return session data in expected format
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        is_admin: user.is_admin,
        phone_number: user.phone_number,
        coupons: user.coupons
      },
      session: {
        access_token: supabaseToken,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: user.name,
            picture: user.picture,
            is_admin: user.is_admin
          }
        }
      }
    })

  } catch (error) {
    console.error('💥 Session verification error:', error)
    return NextResponse.json({ user: null, session: null }, { status: 401 })
  }
}
