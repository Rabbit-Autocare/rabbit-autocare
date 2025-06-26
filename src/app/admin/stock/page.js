'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, Edit, Save, X, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

export default function StockManagementPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [stockUpdateValue, setStockUpdateValue] = useState('');
  const [expandedProducts, setExpandedProducts] = useState({});
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    fetchProductsWithVariants();
  }, []);

  const fetchProductsWithVariants = async () => {
    setLoading(true);
    try {
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

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (e, variant) => {
    e.stopPropagation(); // Prevent row expansion
    setEditingVariantId(variant.id);
    setStockUpdateValue(variant.stock.toString());
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation(); // Prevent row expansion
    setEditingVariantId(null);
    setStockUpdateValue('');
  };

  const handleSaveStock = async (e, variantId) => {
    e.stopPropagation(); // Prevent row expansion

    if (stockUpdateValue === '' || isNaN(parseInt(stockUpdateValue, 10))) {
      alert('Please enter a valid number for the stock.');
      return;
    }

    const newStock = parseInt(stockUpdateValue, 10);
    if (newStock < 0) {
      alert('Stock cannot be negative.');
      return;
    }

    setUpdatingStock(true);
    try {
      const { error } = await supabase.rpc('adjust_variant_stock', {
        variant_id_input: variantId,
        quantity_input: newStock,
        operation: 'set',
      });

      if (error) throw error;

      // Update the local state immediately for better UX
      setProducts(prevProducts =>
        prevProducts.map(product => ({
          ...product,
          product_variants: product.product_variants.map(variant =>
            variant.id === variantId
              ? { ...variant, stock: newStock }
              : variant
          )
        }))
      );

      setEditingVariantId(null);
      setStockUpdateValue('');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleAdjustStock = async (e, variantId, amount) => {
    e.stopPropagation(); // Prevent row expansion

    setUpdatingStock(true);
    try {
      const { error } = await supabase.rpc('adjust_variant_stock', {
        variant_id_input: variantId,
        quantity_input: Math.abs(amount),
        operation: amount > 0 ? 'add' : 'subtract',
      });

      if (error) throw error;

      // Update the local state immediately for better UX
      setProducts(prevProducts =>
        prevProducts.map(product => ({
          ...product,
          product_variants: product.product_variants.map(variant =>
            variant.id === variantId
              ? { ...variant, stock: Math.max(0, variant.stock + amount) }
              : variant
          )
        }))
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock: ' + error.message);
    } finally {
      setUpdatingStock(false);
    }
  };

  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
          </div>
        </div>

        {updatingStock && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 text-sm">Updating stock...</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No products available.'}
              </p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProductExpansion(product.id)}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.main_image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 rounded-md object-cover bg-gray-100"
                    />
                    <div>
                      <h2 className="text-lg font-semibold">{product.name}</h2>
                      <p className="text-sm text-gray-500">{product.product_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{product.product_variants.length} variants</span>
                    {expandedProducts[product.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {expandedProducts[product.id] && (
                  <div className="border-t">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.product_variants.map(variant => (
                          <tr key={variant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                {variant.color && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {variant.color}
                                  </span>
                                )}
                                {variant.size && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {variant.size}
                                  </span>
                                )}
                                {variant.gsm && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {variant.gsm} GSM
                                  </span>
                                )}
                                {variant.quantity && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {variant.quantity}{variant.unit}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {editingVariantId === variant.id ? (
                                <input
                                  type="number"
                                  value={stockUpdateValue}
                                  onChange={(e) => setStockUpdateValue(e.target.value)}
                                  className="w-24 text-center border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  autoFocus
                                  min="0"
                                />
                              ) : (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  variant.stock > 10 ? 'bg-green-100 text-green-800' :
                                  variant.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {variant.stock}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center space-x-2">
                                {editingVariantId === variant.id ? (
                                  <>
                                    <button
                                      onClick={(e) => handleSaveStock(e, variant.id)}
                                      disabled={updatingStock}
                                      className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
                                      title="Save"
                                    >
                                      <Save size={18} />
                                    </button>
                                    <button
                                      onClick={(e) => handleCancelEdit(e)}
                                      disabled={updatingStock}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                                      title="Cancel"
                                    >
                                      <X size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => handleAdjustStock(e, variant.id, -1)}
                                      disabled={updatingStock}
                                      className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                                      title="Decrease stock"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => handleStartEdit(e, variant)}
                                      disabled={updatingStock}
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                                      title="Edit stock"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => handleAdjustStock(e, variant.id, 1)}
                                      disabled={updatingStock}
                                      className="p-2 text-green-500 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
                                      title="Increase stock"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
