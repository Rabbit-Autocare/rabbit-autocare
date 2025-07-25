import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function getServerAuth() {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return { success: false, user: null, error: 'No auth token' }
    }

    // Verify the token
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET)

    // Get user data from database
    const supabase = createSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', decodedToken.userId)
      .single()

    if (error || !user) {
      return { success: false, user: null, error: 'User not found' }
    }

    // Check if user is banned
    if (user.is_banned) {
      return { success: false, user: null, error: 'User banned' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
        picture: user.picture,
        is_admin: user.is_admin,
        is_banned: user.is_banned,
        coupons: user.coupons,
        created_at: user.created_at
      },
      error: null
    }

  } catch (error) {
    console.error('Server auth error:', error)
    return { success: false, user: null, error: error.message }
  }
}

export async function requireAuth(adminOnly = false) {
  const { success, user, error } = await getServerAuth()

  if (!success || !user) {
    return { redirect: '/login', user: null }
  }

  if (adminOnly && !user.is_admin) {
    return { redirect: '/user', user: null }
  }

  return { redirect: null, user }
}
