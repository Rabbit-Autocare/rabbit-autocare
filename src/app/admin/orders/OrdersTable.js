import Link from 'next/link';

const statusColors = {
  confirmed: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
};

export default function OrdersTable({ initialOrders }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-xl">
      <table className="min-w-full text-sm font-inter">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Order #</th>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Total</th>
            <th className="p-3 text-left">Items</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {initialOrders.map((order) => {
            const statusClass = statusColors[order.status?.toLowerCase()] || statusColors.default;
            return (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-3 font-semibold">#{order.order_number}</td>
                <td className="p-3">{order.user_info?.full_name || order.user_info?.email || '-'}</td>
                <td className="p-3">{new Date(order.created_at).toLocaleString()}</td>
                <td className="p-3"><span className={`px-3 py-1 rounded-full font-semibold text-xs ${statusClass}`}>{order.status || 'Processing'}</span></td>
                <td className="p-3">₹{order.total}</td>
                <td className="p-3">{order.items?.length || 0}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${order.order_number}`} className="text-purple-700 hover:underline font-medium">View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
