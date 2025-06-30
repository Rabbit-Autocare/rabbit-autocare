import AdminLayout from '@/components/layouts/AdminLayout';
import AdminProductsClient from '@/components/admin/AdminProductsClient';
import { ServerProductService } from '@/lib/service/serverProductService';
import '@/app/globals.css';

// Server Component - handles initial data fetching
export default async function AdminProductsPage() {
  let initialProducts = [];
  let initialCategories = [];
  let error = null;

  try {
    // Fetch initial data on the server using ServerProductService
    const [products, categories] = await Promise.all([
      ServerProductService.getProducts(),
      ServerProductService.getCategories(),
    ]);

    initialProducts = products || [];
    initialCategories = categories || [];
  } catch (err) {
    console.error('Error fetching initial data:', err);
    error = err.message;
  }

  return (
    <AdminLayout>
      <AdminProductsClient
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialError={error}
      />
    </AdminLayout>
  );
}
