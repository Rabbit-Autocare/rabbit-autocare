// components/admin/analytics/StockDashboard.js
'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

// Custom Card Component
const CustomCard = ({ children, className }) => (
  <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CustomCardHeader = ({ children, className }) => (
  <div className={`p-6 pb-2 ${className}`}>{children}</div>
);

const CustomCardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`}>
    {children}
  </h3>
);

const CustomCardContent = ({ children, className }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const StatCard = ({ title, value, description }) => (
  <CustomCard>
    <CustomCardHeader>
      <CustomCardTitle className='text-sm font-medium text-gray-500'>
        {title}
      </CustomCardTitle>
    </CustomCardHeader>
    <CustomCardContent>
      <div className='text-2xl font-bold'>{value}</div>
      <p className='text-xs text-gray-500 mt-1'>{description}</p>
    </CustomCardContent>
  </CustomCard>
);

export default function StockDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    fetchStockData();
  }, [page]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // Fetch analytics KPIs
      if (page === 1) {
        // Only fetch analytics on the first page load
        const { data: analyticsData, error: analyticsError } =
          await supabase.rpc('get_stock_analytics');
        if (analyticsError) throw analyticsError;
        setAnalytics(analyticsData[0]);
      }

      // Fetch low stock products
      const { data: productsData, error: productsError } = await supabase.rpc(
        'get_low_stock_products',
        {
          page_num: page,
          page_size: pageSize,
        }
      );

      if (productsError) throw productsError;

      setLowStockProducts(productsData || []);
      if (productsData && productsData.length > 0) {
        setTotalRows(productsData[0].total_rows);
      } else {
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('Failed to fetch stock data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRows / pageSize);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <h2 className='text-3xl font-bold'>Stock Analytics</h2>

      {analytics && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Variants'
            value={analytics.total_variants}
            description='Total distinct product variants'
          />
          <StatCard
            title='Low Stock'
            value={analytics.low_stock_variants}
            description={`Variants at or below ${analytics.low_stock_threshold} units`}
          />
          <StatCard
            title='Out of Stock'
            value={analytics.out_of_stock_variants}
            description='Variants with zero quantity'
          />
          <StatCard
            title='Low Stock Threshold'
            value={analytics.low_stock_threshold}
            description='The quantity level that triggers a low stock alert'
          />
        </div>
      )}

      <CustomCard>
        <CustomCardHeader>
          <CustomCardTitle>Low Stock Products</CustomCardTitle>
        </CustomCardHeader>
        <CustomCardContent>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Product
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Variant
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    SKU
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((item) => (
                    <tr key={item.variant_id}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {item.product_name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {item.variant_name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {item.sku}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                          item.quantity === 0
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan='4'
                      className='px-6 py-4 text-center text-sm text-gray-500'
                    >
                      No low stock products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CustomCardContent>
      </CustomCard>

      {totalPages > 1 && (
        <div className='flex justify-between items-center pt-4'>
          <span className='text-sm text-gray-600'>
            Page {page} of {totalPages}
          </span>
          <div className='space-x-2'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
