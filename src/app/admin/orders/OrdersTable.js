import Link from 'next/link';

export default function OrdersTable({ initialOrders }) {
  const router = Link();

  return (
    <div className="space-y-4">
      {initialOrders.map((order) => (
        <div
          key={order.id}
          onClick={() => router.push(`/admin/orders/${order.order_number}`)}
          className="p-4 bg-white rounded shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-semibold">#{order.order_number}</h3>
              <p className="text-sm text-gray-600">{order.user_info?.email}</p>
            </div>
            <div className="text-sm text-gray-700">₹{order.total}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
