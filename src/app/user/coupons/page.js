export const runtime = 'nodejs'

import { requireAuth } from '@/lib/auth/server-auth'
import { UserService } from '@/lib/service/userService'
import UserCouponsClient from '@/components/user/UserCouponsClient'
import { redirect } from 'next/navigation'

export default async function UserCouponsPage() {
  // 1) Authenticate
  const { redirect: to, user } = await requireAuth(false)
  if (to) redirect(to)
  if (user.is_admin) redirect('/admin')

  // 2) Fetch coupons
  const { success: ok, data: d } = await UserService.getUserCoupons(user.id)
  if (!ok) console.error('Failed to fetch user coupons')
  const { userCoupons = [], availableCoupons = [] } = d || {}

  // 3) Render
  return (
    <UserCouponsClient
      initialUserCoupons={userCoupons}
      initialAvailableCoupons={availableCoupons}
    />
  )
}
