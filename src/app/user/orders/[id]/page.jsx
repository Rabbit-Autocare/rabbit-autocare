import { UserService } from '@/lib/service/userService';
import UserOrderDetailsClient from '@/components/user/UserOrderDetailsClient';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function OrderDetailPage({ params }) {
  const { id } = params;

  // 1. Get user session
  const { success: sessionSuccess, user } = await UserService.getUserSession();
  if (!sessionSuccess || !user) {
    redirect('/login');
  }

  // 2. Fetch order details for the logged-in user
  const { success: orderSuccess, data: order } = await UserService.getUserOrderDetails(id, user.id);

  if (!orderSuccess || !order) {
    notFound();
  }

  // 3. Render the client component with the order data
  return <UserOrderDetailsClient order={order} />;
}
