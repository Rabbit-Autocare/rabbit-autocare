export const runtime = 'nodejs'

import { requireAuth } from '@/lib/auth/server-auth'
import { UserService } from '@/lib/service/userService'
import UserAddressBookClient from '@/components/user/UserAddressBookClient'
import { redirect } from 'next/navigation'

export default async function UserAddressBookPage() {
  // 1) Authenticate
  const { redirect: to, user } = await requireAuth(false)
  if (to) redirect(to)
  if (user.is_admin) redirect('/admin')

  // 2) Fetch addresses
  const { success: ok, data: addresses } = await UserService.getUserAddresses(user.id)
  if (!ok) console.error('Failed to fetch user addresses')

  // 3) Render
  return (
    <UserAddressBookClient
      initialAddresses={addresses || []}
      userId={user.id}
    />
  )
}
