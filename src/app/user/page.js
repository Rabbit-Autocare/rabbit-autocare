export const runtime = 'nodejs'

import { requireAuth } from '@/lib/auth/server-auth'
import UserProfileClient from '@/components/user/UserProfileClient'
import { redirect } from 'next/navigation'

export default async function UserProfilePage() {
  // 1) Authenticate
  const { redirect: to, user } = await requireAuth(false)
  if (to) redirect(to)
  if (user.is_admin) redirect('/admin')

  // 2) Prepare props
  const userData = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    picture: user.picture || '',
    coupons: user.coupons || []
  }

  // 3) Render
  return <UserProfileClient initialData={userData} />
}
