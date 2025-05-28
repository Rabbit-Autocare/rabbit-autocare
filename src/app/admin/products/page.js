'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layouts/AdminLayout';
import ProductForm from '../../../components/forms/ProductForm';
import '../../../app/globals.css';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * Product Management Component
 * Allows admins to view, create, edit and delete products
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [user, setUser] = useState(null);

  // Check if the user is authenticated and is an admin
  useEffect(() => {
    async function checkAuth() {
      // Get the current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth error:', error);
        return;
      }

      if (session?.user) {
        // Get user details including admin status
        const { data: userData, error: userError } = await supabase
          .from('auth_users')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('User data error:', userError);
          return;
        }

        if (userData?.is_admin) {
          setUser(session.user);
        } else {
          // Redirect non-admin users
          window.location.href = '/unauthorized';
        }
      } else {
        // Redirect unauthenticated users
        window.location.href = '/login?redirect=/admin/products';
      }
    }

    checkAuth();
  }, []);

  /**
   * Fetches all products from the API
   */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use direct Supabase query instead of API endpoint
      const { data, error } = await supabase.from('products').select('*');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a product
   *
   * @param {string} id - Product ID to delete
   */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      // Get the active session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Unauthorized - Please log in');
      }

      // Use direct Supabase query with auth
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;

      // Optimistically remove from state
      setProducts(products.filter((p) => p.id !== id));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  /**
   * Handle edit product click
   */
  const handleEditClick = (product) => {
    // Check if authenticated first
    if (!user) {
      alert('Unauthorized - Please log in');
      return;
    }

    setEditingProduct(product);
    setShowAddProductForm(true);
  };

  /**
   * Handle form submission success
   */
  const handleFormSuccess = (result) => {
    fetchProducts(); // Refresh products after adding/editing
    setShowAddProductForm(false);
    setEditingProduct(null);
  };

  // Fetch products when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
  };

  // If not authenticated yet, show loading
  if (!user) {
    return (
      <AdminLayout>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-xl font-medium'>
              Checking authentication...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-4xl font-extrabold text-gray-900 tracking-wide'>
            Product Management
          </h1>
          <button
            onClick={() => setShowAddProductForm(true)}
            className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition font-medium flex items-center gap-2'
          >
            <span>+ Add New Product</span>
          </button>
        </div>

        {loading ? (
          <div className='text-center py-8'>
            <div className='text-gray-500'>Loading products...</div>
          </div>
        ) : (
          <div className='overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider'
                  >
                    Image
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider'
                  >
                    Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider'
                  >
                    Category
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider'
                  >
                    Variants (Price, Size, Stock)
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider'
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {products.map((product, idx) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onDelete={() => handleDelete(product.id)}
                    onEdit={() => handleEditClick(product)}
                    onView={() => setModalProduct(product)}
                    isOdd={idx % 2 !== 0}
                    getImageUrl={getImageUrl}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalProduct && (
          <Modal onClose={() => setModalProduct(null)}>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800'>
              {modalProduct.name} - Full Details
            </h2>
            {modalProduct.image && (
              <div className='relative w-full h-64 mb-4 rounded overflow-hidden border border-gray-300'>
                <Image
                  src={getImageUrl(modalProduct.image)}
                  alt={modalProduct.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg'; // Add a placeholder image
                  }}
                />
              </div>
            )}
            <p className='text-gray-700 mb-2'>
              <strong>Category:</strong> {modalProduct.category || 'N/A'}
            </p>
            <div className='text-gray-700'>
              <strong>Variants:</strong>
              {modalProduct.variants && modalProduct.variants.length > 0 ? (
                <ul className='list-disc list-inside space-y-1 mt-1'>
                  {modalProduct.variants.map((v, i) => (
                    <li key={i}>
                      Price: ₹{v.price}, Size: {v.size}, Stock: {v.stock}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No variants available</p>
              )}
            </div>
            <button
              onClick={() => setModalProduct(null)}
              className='mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold transition'
            >
              Close
            </button>
          </Modal>
        )}

        {showAddProductForm && (
          <Modal
            onClose={() => {
              setShowAddProductForm(false);
              setEditingProduct(null);
            }}
          >
            <div className='p-6'>
              <ProductForm
                product={editingProduct}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowAddProductForm(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

function ProductRow({ product, onDelete, onEdit, onView, isOdd, getImageUrl }) {
  return (
    <tr
      className={`${
        isOdd ? 'bg-white' : 'bg-gray-50'
      } hover:bg-indigo-50 transition-colors duration-150 ease-in-out`}
    >
      <td className='px-6 py-4 whitespace-nowrap border-r border-gray-200 text-center'>
        {product.image ? (
          <Image
            src={getImageUrl(product.image)}
            alt={product.name}
            width={80}
            height={60}
            className='rounded-lg shadow-sm'
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-image.jpg'; // Add a placeholder image to your public folder
            }}
          />
        ) : (
          <span className='text-gray-400 italic'>No Image</span>
        )}
      </td>

      <td className='px-6 py-4 whitespace-nowrap border-r border-gray-200'>
        <span className='font-medium text-gray-900'>{product.name}</span>
      </td>

      <td className='px-6 py-4 whitespace-nowrap border-r border-gray-200'>
        <span className='text-gray-700'>{product.category || '-'}</span>
      </td>

      <td className='px-6 py-4 max-w-sm whitespace-normal border-r border-gray-200'>
        {product.variants && product.variants.length > 0 ? (
          <ul className='list-disc list-inside text-gray-700 space-y-1'>
            {product.variants.map((v, i) => (
              <li key={i}>
                ₹{v.price} | Size: {v.size} | Stock: {v.stock}
              </li>
            ))}
          </ul>
        ) : (
          <span className='text-gray-400 italic'>-</span>
        )}
      </td>

      <td className='px-6 py-4 whitespace-nowrap text-center space-x-2'>
        <button
          onClick={onEdit}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md transition'
          type='button'
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className='bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition'
          type='button'
        >
          Delete
        </button>
        <button
          onClick={onView}
          className='bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1 rounded-md transition'
          type='button'
        >
          View
        </button>
      </td>
    </tr>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-lg max-w-4xl w-full shadow-lg max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
