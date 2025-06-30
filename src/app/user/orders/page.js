import { UserService } from '@/lib/service/userService';
import UserOrdersClient from '@/components/user/UserOrdersClient';
import { redirect } from 'next/navigation';

export default async function UserOrdersPage() {
  // Get user session on server side
  const { success: sessionSuccess, user } = await UserService.getUserSession();

  if (!sessionSuccess || !user) {
    redirect('/login');
  }

  // Fetch user orders on server side
  const { success: ordersSuccess, data: orders } = await UserService.getUserOrders(user.id);

  if (!ordersSuccess) {
    console.error('Failed to fetch user orders');
  }

  return <UserOrdersClient initialOrders={orders || []} />;
}
