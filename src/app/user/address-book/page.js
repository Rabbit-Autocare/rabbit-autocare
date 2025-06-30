import { UserService } from '@/lib/service/userService';
import UserAddressBookClient from '@/components/user/UserAddressBookClient';
import { redirect } from 'next/navigation';

export default async function UserAddressBookPage() {
  // Get user session on server side
  const { success: sessionSuccess, user } = await UserService.getUserSession();

  if (!sessionSuccess || !user) {
    redirect('/login');
  }

  // Fetch user addresses on server side
  const { success: addressesSuccess, data: addresses } = await UserService.getUserAddresses(user.id);

  if (!addressesSuccess) {
    console.error('Failed to fetch user addresses');
  }

  return <UserAddressBookClient initialAddresses={addresses || []} userId={user.id} />;
}
