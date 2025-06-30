import { createSupabaseServerClient } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import OrdersTable from './OrdersTable';

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: orders = [], error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <OrdersTable initialOrders={orders} initialError={error?.message || null} />
    </AdminLayout>
  );
}