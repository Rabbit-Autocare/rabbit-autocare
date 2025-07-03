import AdminLayout from '@/components/layouts/AdminLayout';
import AdminProductsClient from '@/components/admin/AdminProductsClient';
import { ServerProductService } from '@/lib/service/serverProductService';
import '@/app/globals.css';

// Server Component - handles initial data fetching
export default async function AdminProductsPage() {
  let initialProducts = [];
  let initialCategories = [];
  let initialColors = [];
  let initialSizes = [];
  let initialGsmValues = [];
  let initialQuantities = [];
  let error = null;

  try {
    // Fetch initial data on the server using ServerProductService
    const [products, categories, colors, sizes, gsmValues, quantities] = await Promise.all([
      ServerProductService.getProducts(),
      ServerProductService.getCategories(),
      ServerProductService.getColors(),
      ServerProductService.getSizes(),
      ServerProductService.getGSM(),
      ServerProductService.getQuantities(),
    ]);

    initialProducts = products || [];
    initialCategories = categories || [];
    initialColors = colors || [];
    initialSizes = sizes || [];
    initialGsmValues = gsmValues || [];
    initialQuantities = quantities || [];
  } catch (err) {
    console.error('Error fetching initial data:', err);
    error = err.message;
  }

  return (
    <AdminLayout>
      <AdminProductsClient
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialColors={initialColors}
        initialSizes={initialSizes}
        initialGsmValues={initialGsmValues}
        initialQuantities={initialQuantities}
        initialError={error}
      />
    </AdminLayout>
  );
}
