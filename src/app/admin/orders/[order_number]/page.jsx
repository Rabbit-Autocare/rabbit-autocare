// src/app/admin/orders/[order_number]/invoice/page.jsx
import InvoiceTemplate from '@/components/InvoiceTemplate';

export default function InvoicePage({ params }) {
  const { order_number } = params;

  return <InvoiceTemplate orderNumber={order_number} />;
}
