import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import UserProfileClient from '@/components/user/UserProfileClient'

export default async function UserProfilePage() {
  try {
    // Get auth token from cookies
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      redirect('/login')
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
      redirect('/login?error=user_not_found')
    }

    // Check if user is banned
    if (user.is_banned) {
      redirect('/login?error=account_banned')
    }

    // Redirect admin users to admin page
    if (user.is_admin) {
      redirect('/admin')
    }

    const userData = {
      id: user.id,
      name: user.name || '',
      phone_number: user.phone_number || '',
      email: user.email || '',
      picture: user.picture || '',
      coupons: user.coupons || []
    }

    return <UserProfileClient initialData={userData} />

  } catch (error) {
    console.error('User page auth error:', error)
    redirect('/login?error=auth_failed')
  }
}
