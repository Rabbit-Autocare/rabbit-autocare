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

  const handleStartEdit = (variant) => {
    setEditingVariantId(variant.id);
    setStockUpdateValue(variant.stock.toString());
  };

  const handleCancelEdit = () => {
    setEditingVariantId(null);
    setStockUpdateValue('');
  };

  const handleSaveStock = async (variantId) => {
    if (stockUpdateValue === '' || isNaN(parseInt(stockUpdateValue, 10))) {
      alert('Please enter a valid number for the stock.');
      return;
    }
    const newStock = parseInt(stockUpdateValue, 10);

    setLoading(true);
    try {
      const { error } = await supabase.rpc('adjust_variant_stock', {
        variant_id_input: variantId,
        quantity_input: newStock,
        operation: 'set',
      });
      if (error) throw error;
      await fetchProductsWithVariants(); // Refresh data
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    } finally {
      setEditingVariantId(null);
      setStockUpdateValue('');
      setLoading(false);
    }
  };

  const handleAdjustStock = async (variantId, amount) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('adjust_variant_stock', {
        variant_id_input: variantId,
        quantity_input: Math.abs(amount),
        operation: amount > 0 ? 'add' : 'subtract',
      });
      if (error) throw error;
      await fetchProductsWithVariants();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {loading && <div className="text-center py-4">Loading...</div>}

        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleProductExpansion(product.id)}
              >
                <div className="flex items-center space-x-4">
                  <img src={product.main_image_url || '/placeholder.svg'} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
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
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                        <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {product.product_variants.map(variant => (
                        <tr key={variant.id}>
                          <td className="px-6 py-3">
                            {variant.color && <span>{variant.color}</span>}
                            {variant.size && <span className="ml-2">{variant.size}</span>}
                            {variant.gsm && <span className="ml-2">{variant.gsm} GSM</span>}
                            {variant.quantity && <span className="ml-2">{variant.quantity}{variant.unit}</span>}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {editingVariantId === variant.id ? (
                              <input
                                type="number"
                                value={stockUpdateValue}
                                onChange={(e) => setStockUpdateValue(e.target.value)}
                                className="w-24 text-center border rounded-md py-1"
                                autoFocus
                              />
                            ) : (
                              <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                                variant.stock > 10 ? 'bg-green-100 text-green-800' :
                                variant.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {variant.stock}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              {editingVariantId === variant.id ? (
                                <>
                                  <button onClick={() => handleSaveStock(variant.id)} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
                                  <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><X size={18} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleAdjustStock(variant.id, -1)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Minus size={16} /></button>
                                  <button onClick={() => handleStartEdit(variant)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16} /></button>
                                  <button onClick={() => handleAdjustStock(variant.id, 1)} className="p-2 text-green-500 hover:bg-green-100 rounded-full"><Plus size={16} /></button>
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
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
