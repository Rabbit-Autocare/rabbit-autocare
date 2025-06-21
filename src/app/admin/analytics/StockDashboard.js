// components/admin/analytics/StockDashboard.js
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { StockService } from '../../../lib/service/stockService';

export default function StockDashboard() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [stockSummary, setStockSummary] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdateForm, setStockUpdateForm] = useState({
    variantId: '',
    newStock: 0,
    operation: 'set' // 'set', 'add', 'subtract'
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch products with variants
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            category_name,
            product_code,
            product_variants (
              id,
              color,
              size,
              gsm,
              quantity,
              unit,
              price,
              stock,
              compare_at_price
            )
          `)
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch stock summary
        const summary = await StockService.getStockSummary();
        setStockSummary(summary);

        // Fetch low stock alerts
        const alerts = await StockService.getLowStockAlerts(10);
        setLowStockAlerts(alerts);

      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.product_code?.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category_name !== category) return false;
    if (sizeFilter && !p.product_variants?.some((v) => v.size === sizeFilter)) return false;
    return true;
  });

  const categories = [...new Set(products.map(p => p.category_name))].filter(Boolean);
  const sizes = [...new Set(products.flatMap(p => p.product_variants?.map(v => v.size) || []))].filter(Boolean);

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockUpdateForm.variantId || stockUpdateForm.newStock < 0) return;

    try {
      let newStock;
      if (stockUpdateForm.operation === 'set') {
        // Direct update
        const { error } = await supabase
          .from('product_variants')
          .update({
            stock: stockUpdateForm.newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', stockUpdateForm.variantId);

        if (error) throw error;
      } else {
        // Use increment/decrement
        await StockService.updateStock(
          stockUpdateForm.variantId,
          stockUpdateForm.newStock,
          stockUpdateForm.operation
        );
      }

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + error.message);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="text-center mt-4">Loading stock data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Stock Management Dashboard</h1>

      {/* Stock Summary Cards */}
      {stockSummary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold">{stockSummary.total_products}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Variants</h3>
            <p className="text-2xl font-bold">{stockSummary.total_variants}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">In Stock</h3>
            <p className="text-2xl font-bold text-green-600">{stockSummary.in_stock_variants}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
            <p className="text-2xl font-bold text-orange-600">{stockSummary.low_stock_variants}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600">{stockSummary.out_of_stock_variants}</p>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-3">Low Stock Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.slice(0, 6).map((alert, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <p className="font-medium text-sm">{alert.product_name}</p>
                <p className="text-xs text-gray-600">
                  {alert.variant_details.color && `${alert.variant_details.color} `}
                  {alert.variant_details.size && `${alert.variant_details.size} `}
                  {alert.variant_details.gsm && `${alert.variant_details.gsm} GSM `}
                  {alert.variant_details.quantity && `${alert.variant_details.quantity} ${alert.variant_details.unit}`}
                </p>
                <p className="text-sm font-semibold text-red-600">
                  Stock: {alert.current_stock}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Sizes</option>
            {sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Update Form */}
      {selectedProduct && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Update Stock</h3>
          <form onSubmit={handleStockUpdate} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Variant</label>
              <select
                value={stockUpdateForm.variantId}
                onChange={(e) => setStockUpdateForm(prev => ({ ...prev, variantId: e.target.value }))}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Variant</option>
                {selectedProduct.product_variants?.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.color} {variant.size} {variant.gsm && `${variant.gsm} GSM`}
                    {variant.quantity && ` ${variant.quantity} ${variant.unit}`}
                    (Current: {variant.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operation</label>
              <select
                value={stockUpdateForm.operation}
                onChange={(e) => setStockUpdateForm(prev => ({ ...prev, operation: e.target.value }))}
                className="border rounded px-3 py-2"
              >
                <option value="set">Set to</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={stockUpdateForm.newStock}
                onChange={(e) => setStockUpdateForm(prev => ({ ...prev, newStock: parseInt(e.target.value) || 0 }))}
                className="border rounded px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update Stock
            </button>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.product_code}</div>
                      <div className="text-sm text-gray-500">{product.category_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {product.product_variants?.map((variant) => {
                        const status = getStockStatus(variant.stock);
                        return (
                          <div key={variant.id} className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium">
                                {variant.color} {variant.size} {variant.gsm && `${variant.gsm} GSM`}
                                {variant.quantity && ` ${variant.quantity} ${variant.unit}`}
                              </span>
                              <div className="text-gray-500">₹{variant.price}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {variant.stock} ({status.text})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {product.product_variants?.map((variant) => {
                        const status = getStockStatus(variant.stock);
                        return (
                          <span key={variant.id} className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Manage Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
