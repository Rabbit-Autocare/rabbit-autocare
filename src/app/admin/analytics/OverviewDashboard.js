// components/admin/analytics/OverviewDashboard.js
'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Cell,
} from 'recharts';
import { supabase } from '../../../lib/supabaseClient';
import "../../../app/globals.css";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF1493'];

export default function OverviewDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, variants, created_at');

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } else {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const filteredProducts = filterMonth
    ? products.filter((p) => {
        if (!p.created_at) return false;
        const productMonth = new Date(p.created_at).toISOString().slice(0, 7);
        return productMonth === filterMonth;
      })
    : products;

  const categoryMap = {};
  filteredProducts.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const topSellingData = [...filteredProducts]
    .map((p) => ({ name: p.name, sold: p.sold || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const totalStock = filteredProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalSold = filteredProducts.reduce((acc, p) => acc + (p.sold || 0), 0);

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Overview Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label htmlFor="monthFilter">Filter by Month:</label>
          <select
            id="monthFilter"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">All</option>
            <option value="2025-03">March 2025</option>
            <option value="2025-04">April 2025</option>
            <option value="2025-05">May 2025</option>
          </select>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="toggle-button"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <div className="summary-cards">
            <div className="card">
              <h3>{totalStock}</h3>
              <p>Total Stock</p>
            </div>
            <div className="card">
              <h3>{totalSold}</h3>
              <p>Total Sold</p>
            </div>
            <div className="card">
              <h3>{filteredProducts.length}</h3>
              <p>Products</p>
            </div>
          </div>

          <div className="charts">
            <div className="chart-wrapper">
              <h3>Product Category Distribution</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`bar-cat-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-wrapper">
              <h3>Top Selling Products</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={topSellingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="sold" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-wrapper">
              <h3>Product Stock Levels</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={filteredProducts.map((p) => ({
                    name: p.name,
                    stock: p.stock,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="stock">
                    {filteredProducts.map((entry, index) => (
                      <Cell
                        key={`bar-stock-${index}`}
                        fill={entry.stock <= 10 ? '#FF4C4C' : '#8884d8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
