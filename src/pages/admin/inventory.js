'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminSidebar from '../../components/admin/AdminSidebar';
import "../../app/globals.css";
export default function InventoryTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch products with variants from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, variants')
      .order('name', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setProducts(data);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle selling 1 unit of a variant (decrement stock)
  const handleSellUnit = async (productId, variantIndex) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const variantsCopy = [...product.variants];
    const variant = variantsCopy[variantIndex];

    if (variant.stock <= 0) {
      alert('Stock is already zero!');
      return;
    }

    variantsCopy[variantIndex] = {
      ...variant,
      stock: variant.stock - 1,
    };

    // Update DB
    const { error } = await supabase
      .from('products')
      .update({ variants: variantsCopy })
      .eq('id', productId);

    if (error) {
      alert('Failed to update stock: ' + error.message);
      return;
    }

    // Update UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, variants: variantsCopy } : p
      )
    );
  };

  return (  
    <div className='display flex'>
  <AdminSidebar/>
    <div className="p-6 bg-white rounded-lg shadow-lg  mx-auto">
    
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Inventory Management</h1>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant (Size)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}

              {products.map((product) =>
                product.variants?.map((variant, idx) => {
                  const lowStock = variant.stock < 10;

                  return (
                    <tr
                      key={`${product.id}-${idx}`}
                      className={lowStock ? 'bg-red-50' : ''}
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={product.variants.length}
                          className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900"
                        >
                          {product.name}
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap">{variant.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-700 font-medium">
                        ₹{variant.price ?? product.price ?? '-'}
                      </td>

                      <td
                        className={`px-6 py-4 whitespace-nowrap font-semibold ${
                          lowStock ? 'text-red-600' : 'text-gray-900'
                        } flex items-center gap-1`}
                      >
                        {variant.stock}
                        {lowStock && (
                          <span
                            title="Low Stock"
                            className="text-red-600 text-xl select-none"
                          >
                            ⚠️
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSellUnit(product.id, idx)}
                          disabled={variant.stock === 0}
                          className={`px-3 py-1 rounded-md text-white ${
                            variant.stock === 0
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } transition`}
                          title={
                            variant.stock === 0
                              ? 'Out of Stock'
                              : 'Sell 1 unit'
                          }
                        >
                          Sell 1 unit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div></div>
  );
}
