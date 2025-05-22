// components/admin/analytics/StockDashboard.js
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function StockDashboard() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStock() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, variants');
      if (!error) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchStock();
  }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    if (sizeFilter && !p.variants?.some((v) => v.size === sizeFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📦 Stock Dashboard</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by product name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Categories</option>
          {[...new Set(products.map((p) => p.category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Sizes</option>
        {['50ml', '100ml', '250ml', '500ml', '1L', '5L'].map((size) => (
  <option key={size} value={size}>{size}</option>
))}
        </select>
      </div>

      {/* Stock Table */}
      {loading ? (
        <p>Loading stock data...</p>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2">Product</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-left px-4 py-2">Sizes</th>
                <th className="text-left px-4 py-2">Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const total = p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="px-4 py-2">
                    {p.variants?.map((v) => (
  <span
    key={v.size}
    className="inline-block px-2 py-1 bg-gray-200 rounded mr-1"
  >
    {v.size}: {v.stock}
  </span>
))}

                    </td>
                    <td className="px-4 py-2 font-semibold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
