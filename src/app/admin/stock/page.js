import { createSupabaseServerClient } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import StockTable from './StockTable';

export default async function StockManagementPage() {
  const supabase = await createSupabaseServerClient(); // <-- await here!
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_code,
      main_image_url,
      product_variants (
        id,
        color,
        size,
        gsm,
        quantity,
        unit,
        price,
        stock
      )
    `)
    .order('name', { ascending: true });

  const products = data || [];

  return (
    <AdminLayout>
      <StockTable initialProducts={products} />
    </AdminLayout>
  );
}