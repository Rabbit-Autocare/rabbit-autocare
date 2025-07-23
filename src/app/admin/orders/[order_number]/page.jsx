// src/app/admin/orders/[order_number]/invoice/page.jsx
import AdminOrderDetails from '@/components/admin/AdminOrderDetails';

export default function AdminOrderPage({ params }) {
  const { order_number } = params;
  return <AdminOrderDetails orderNumber={order_number} />;
}
