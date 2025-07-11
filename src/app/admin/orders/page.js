import { createSupabaseServerClient } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: orders = [], error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">All Orders</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
            Error loading orders: {error.message}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-gray-600">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                href={`/admin/orders/${order.order_number}`}
                key={order.id}
                className="block bg-white border rounded-lg p-4 hover:shadow transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">#{order.order_number}</h3>
                    <p className="text-sm text-gray-600">{order.user_info?.email}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-700 font-medium">₹{order.total}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {order.items?.length || 0} items
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
