import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoiceTemplate from '@/components/InvoiceTemplate';

export async function GET(req, { params }) {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', params.order_number)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(<InvoiceTemplate order={order} />);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${order.order_number}.pdf`,
    },
  });
}
