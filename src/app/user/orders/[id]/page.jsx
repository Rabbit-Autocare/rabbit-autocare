export const runtime = 'nodejs'

import { requireAuth } from '@/lib/auth/server-auth'
import { UserService } from '@/lib/service/userService'
import UserOrderDetailsClient from '@/components/user/UserOrderDetailsClient'
import { redirect, notFound } from 'next/navigation'

export default async function OrderDetailPage({ params }) {
  const { id } = params

  // 1) Authenticate
  const { redirect: to, user } = await requireAuth(false)
  if (to) redirect(to)
  if (user.is_admin) redirect('/admin')

  // 2) Fetch a single order
  const { success: ok, data: order } = await UserService.getUserOrderDetails(id, user.id)
  if (!ok || !order) notFound()

  // 3) Render
  return <UserOrderDetailsClient order={order} />
}
