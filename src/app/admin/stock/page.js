import { createSupabaseServerClient } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import StockTable from '../../../components/admin/StockTable';

export default async function StockManagementPage() {
  const supabase = await createSupabaseServerClient(); // <-- await here!
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_code,
      main_image_url,
      product_type,
      category,
      product_variants (
        id,
        variant_code,
        color,
        size,
        gsm,
        quantity,
        unit,
        base_price,
        stock,
        is_active
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
