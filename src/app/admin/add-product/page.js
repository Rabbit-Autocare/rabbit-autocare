'use clien';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AddProductForm from '../../components/forms/AddProductForm';

export default function AddProductPage() {
  return (
    <div className='flex'>
      <AdminSidebar />
      <main className='ml-60 p-6 w-full'>
        <AddProductForm onProductAdded={() => alert('Product added!')} />
      </main>
    </div>
  );
}
