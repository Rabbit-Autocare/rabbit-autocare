export const runtime = 'nodejs'

import { requireAuth } from '@/lib/auth/server-auth'
import { UserService } from '@/lib/service/userService'
import UserOrdersClient from '@/components/user/UserOrdersClient'
import { redirect } from 'next/navigation'

export default async function UserOrdersPage() {
  // 1) Authenticate
  const { redirect: to, user } = await requireAuth(false)
  if (to) redirect(to)
  if (user.is_admin) redirect('/admin')

  // 2) Fetch orders
  const { success: ok, data: orders } = await UserService.getUserOrders(user.id)
  if (!ok) console.error('Failed to fetch user orders')

  // 3) Render
  return <UserOrdersClient initialOrders={orders || []} />
}
