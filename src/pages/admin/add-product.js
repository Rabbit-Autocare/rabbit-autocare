'use clien'
import AdminSidebar from '../../components/AdminSidebar';
import AddProductForm from '../../components/AddProductForm';

export default function AddProductPage() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-60 p-6 w-full">
        <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
        <AddProductForm onProductAdded={() => alert('Product added!')} />
      </main>
    </div>
  );
}
