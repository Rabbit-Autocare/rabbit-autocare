'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import '../../app/globals.css';
import AdminLayout from '@/components/layouts/AdminLayout';

/**
 * Inventory Manager Component
 * Allows admin to view and update stock levels for products
 */
export default function InventoryManagerPage() {
  const [products, setProducts] = useState([]);
  const [updatedStock, setUpdatedStock] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all products with their stock information
   */
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Handles stock input field changes
   *
   * @param {string} productId - ID of the product
   * @param {string} value - New stock value
   */
  const handleStockChange = (productId, value) => {
    setUpdatedStock({
      ...updatedStock,
      [productId]: value,
    });
  };

  /**
   * Updates the stock level for a specific product
   *
   * @param {string} productId - ID of the product to update
   */
  const updateStock = async (productId) => {
    const newStock = parseInt(updatedStock[productId]);
    if (isNaN(newStock)) {
      alert('Enter a valid number');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (error) {
      console.error('Stock update error:', error);
      alert('Failed to update stock');
    } else {
      alert('Stock updated successfully');
      fetchProducts(); // Refresh data
      setUpdatedStock({ ...updatedStock, [productId]: '' });
    }

    setLoading(false);
  };

  return (
    <>
      <AdminLayout>
        <div className='p-6 max-w-4xl mx-auto bg-white rounded shadow'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800 text-center'>
            Inventory Manager
          </h2>
          <table className='w-full border'>
            <thead className='bg-gray-100 text-left'>
              <tr>
                <th className='p-3 border'>Product Name</th>
                <th className='p-3 border'>Current Stock</th>
                <th className='p-3 border'>Update Stock</th>
                <th className='p-3 border'>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} className='text-sm'>
                  <td className='p-3 border'>{prod.name}</td>
                  <td
                    className={`p-3 border ${
                      prod.stock < 5 ? 'text-red-600 font-bold' : ''
                    }`}
                  >
                    {prod.stock}
                  </td>
                  <td className='p-3 border'>
                    <input
                      type='number'
                      placeholder='Enter new stock'
                      value={updatedStock[prod.id] || ''}
                      onChange={(e) =>
                        handleStockChange(prod.id, e.target.value)
                      }
                      className='border rounded p-1 w-24'
                    />
                  </td>
                  <td className='p-3 border'>
                    <button
                      onClick={() => updateStock(prod.id)}
                      disabled={loading}
                      className='bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700'
                    >
                      {loading ? 'Updating...' : 'Update'}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan='4' className='p-4 text-center text-gray-500'>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </>
  );
}
