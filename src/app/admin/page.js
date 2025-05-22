'use client';
import '../../app/globals.css';
import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';

// Colors for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A020F0',
  '#FF1493',
];

/**
 * Admin Dashboard Component
 * Displays analytics, charts and key business metrics
 */
export default function Dashboard() {
  // UI states
  const [darkMode, setDarkMode] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');

  // Data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponStats, setCouponStats] = useState({
    totalActive: 0,
    mostUsed: null,
  });

  // Fetch products data on component mount
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (!error) {
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Fetch coupon statistics
  useEffect(() => {
    async function fetchData() {
      // Fetch coupon stats
      const { data: activeCoupons } = await supabase
        .from('coupons')
        .select('count')
        .eq('is_active', true);

      const { data: couponUsage } = await supabase.rpc('get_most_used_coupon');
      let mostUsedCoupon = null;
      if (couponUsage && couponUsage.length > 0) {
        mostUsedCoupon = couponUsage[0];
      }

      if (mostUsedCoupon) {
        const { data: couponDetails } = await supabase
          .from('coupons')
          .select('*')
          .eq('id', mostUsedCoupon.coupon_id)
          .single();

        setCouponStats({
          totalActive: activeCoupons?.length || 0,
          mostUsed: couponDetails,
        });
      } else {
        setCouponStats({
          totalActive: activeCoupons?.length || 0,
          mostUsed: null,
        });
      }
    }

    fetchData();
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Filter products by selected month
  const filteredProducts = filterMonth
    ? products.filter((p) => {
        if (!p.created_at) return false;
        const productMonth = new Date(p.created_at).toISOString().slice(0, 7);
        return productMonth === filterMonth;
      })
    : products;

  // Calculate category distribution for charts
  const categoryMap = {};
  filteredProducts.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Calculate top selling products for charts
  const topSellingData = [...filteredProducts]
    .map((p) => ({ name: p.name, sold: p.sold || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Calculate inventory statistics
  const totalStock = filteredProducts.reduce(
    (acc, p) => acc + (p.stock || 0),
    0
  );
  const totalSold = filteredProducts.reduce((acc, p) => acc + (p.sold || 0), 0);

  return (
    <>
      <style>{`
        body {
          transition: background-color 0.5s, color 0.5s;
          background-color: #f5f5f5;
          color: #333;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body.dark {
          background-color: #121212;
          color: #eee;
        }
        .dashboard-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 1rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .toggle-button {
          cursor: pointer;
          background: none;
          border: 2px solid currentColor;
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 600;
          transition: background-color 0.3s, color 0.3s;
        }
        .toggle-button:hover {
          background-color: #0070f3;
          color: white;
          border-color: #0070f3;
        }
        select {
          padding: 0.5rem 0.75rem;
          border-radius: 5px;
          border: 1px solid #ccc;
          font-size: 1rem;
          background-color: white;
          color: #333;
          transition: background-color 0.3s, color 0.3s;
        }
        body.dark select {
          background-color: #333;
          color: #eee;
          border-color: #555;
        }
        .summary-cards {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem 2rem;
          box-shadow: 0 3px 10px rgb(0 0 0 / 0.1);
          flex: 1;
          text-align: center;
          transition: background-color 0.3s, color 0.3s;
        }
        body.dark .card {
          background-color: #1e1e1e;
          color: #ddd;
          box-shadow: 0 3px 10px rgb(255 255 255 / 0.05);
        }
        .card h3 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .charts {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .chart-wrapper {
          background-color: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgb(0 0 0 / 0.1);
          flex: 1 1 400px;
          max-width: 600px;
          height: 350px;
          transition: background-color 0.3s, color 0.3s;
        }
        body.dark .chart-wrapper {
          background-color: #1e1e1e;
          color: #ddd;
          box-shadow: 0 3px 10px rgb(255 255 255 / 0.05);
        }
      `}</style>
      <AdminLayout>
        <div className='dashboard-container'>
          <div className='header'>
            <h1> Dashboard</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label htmlFor='monthFilter'>Filter by Month:</label>
              <select
                id='monthFilter'
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value=''>All</option>
                <option value='2025-03'>March 2025</option>
                <option value='2025-04'>April 2025</option>
                <option value='2025-05'>May 2025</option>
              </select>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className='toggle-button'
                aria-label='Toggle Dark Mode'
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <>
              <div className='summary-cards'>
                <div className='card'>
                  <h3>{totalStock}</h3>
                  <p>Total Stock</p>
                </div>
                <div className='card'>
                  <h3>{totalSold}</h3>
                  <p>Total Sold</p>
                </div>
                <div className='card'>
                  <h3>{filteredProducts.length}</h3>
                  <p>Products</p>
                </div>
                <div className='card'>
                  <h3>{couponStats.totalActive}</h3>
                  <p>Active Coupons</p>
                </div>
                {couponStats.mostUsed && (
                  <div className='card'>
                    <h3>{couponStats.mostUsed.code}</h3>
                    <p>Most Used Coupon</p>
                  </div>
                )}
              </div>

              <div className='charts'>
                <div className='chart-wrapper'>
                  <h3>Product Category Distribution</h3>
                  <ResponsiveContainer width='100%' height='90%'>
                    <BarChart
                      data={categoryData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='name'
                        angle={-45}
                        textAnchor='end'
                        interval={0}
                      />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey='value'>
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

                <div className='chart-wrapper'>
                  <h3>Top Selling Products</h3>
                  <ResponsiveContainer width='100%' height='90%'>
                    <BarChart
                      data={topSellingData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='name' />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey='sold' fill='#82ca9d' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className='chart-wrapper'>
                  <h3>Product Stock Levels</h3>
                  <ResponsiveContainer width='100%' height='90%'>
                    <BarChart
                      data={filteredProducts.map((p) => ({
                        name: p.name,
                        stock: p.stock,
                      }))}
                      margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='name'
                        angle={-45}
                        textAnchor='end'
                        interval={0}
                      />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey='stock'>
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
      </AdminLayout>
    </>
  );
}
// 'use client'
// import AnalyticsTabs from './analytics/AnalyticsTabs';
// import "../../app/globals.css"
// export default function AdminAnalyticsPage() {
//   return <AnalyticsTabs />;
// }
