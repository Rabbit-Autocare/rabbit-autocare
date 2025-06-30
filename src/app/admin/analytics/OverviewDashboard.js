// components/admin/analytics/OverviewDashboard.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

const StatCard = ({ title, value, subValue, loading }) => (
  <CustomCard className='col-span-1'>
    <CustomCardHeader>
      <CustomCardTitle>{title}</CustomCardTitle>
    </CustomCardHeader>
    <CustomCardContent>
      {loading ? (
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-24'></div>
          <div className='h-4 bg-gray-200 rounded w-16 mt-2'></div>
        </div>
      ) : (
        <>
          <div className='text-2xl font-bold'>
            ₹{value.toLocaleString('en-IN')}
          </div>
          {subValue && <div className='text-sm text-gray-500'>{subValue}</div>}
        </>
      )}
    </CustomCardContent>
  </CustomCard>
);

export default function OverviewDashboard({
  initialData,
  userAuth,
  defaultDateRange,
}) {
  // Initialize state with server-side data
  const [salesOverTime, setSalesOverTime] = useState(
    initialData?.salesStats?.salesOverTime || []
  );
  const [topProducts, setTopProducts] = useState(
    initialData?.topProducts || []
  );
  const [salesStats, setSalesStats] = useState({
    totalRevenue: initialData?.salesStats?.totalRevenue || 0,
    totalOrders: initialData?.salesStats?.totalOrders || 0,
    averageOrderValue: initialData?.salesStats?.averageOrderValue || 0,
    totalProducts: initialData?.salesStats?.totalProducts || 0,
  });
  const [stockOverview, setStockOverview] = useState(
    initialData?.stockOverview || []
  );

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    return defaultDateRange?.startDate
      ? new Date(defaultDateRange.startDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d;
        })();
  });
  const [endDate, setEndDate] = useState(() => {
    return defaultDateRange?.endDate
      ? new Date(defaultDateRange.endDate)
      : new Date();
  });

  const [loading, setLoading] = useState(false);
  const [hasInitialData] = useState(!!initialData);

  // Create Supabase client for browser-side data fetching
  const supabase = createSupabaseBrowserClient();

  const fetchStockOverview = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_category_stock_overview');
      if (error) throw error;
      setStockOverview(data || []);
    } catch (error) {
      console.error('Error fetching stock overview:', error);
      alert('Failed to fetch stock overview: ' + error.message);
    }
  }, [supabase]);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const from = startDate.toISOString().split('T')[0];
      const to = endDate.toISOString().split('T')[0];

      // Fetch daily sales data
      const { data: dailySales, error: salesError } = await supabase
        .from('sales_records')
        .select('sale_date, total_price, order_number, quantity')
        .gte('sale_date', from)
        .lte('sale_date', to)
        .order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      // Process daily sales data
      const salesByDate = dailySales.reduce((acc, sale) => {
        const date = sale.sale_date;
        acc[date] = (acc[date] || 0) + sale.total_price;
        return acc;
      }, {});

      const processedSales = Object.entries(salesByDate).map(
        ([date, total]) => ({
          sale_date: new Date(date).toLocaleDateString(),
          daily_revenue: total,
        })
      );

      setSalesOverTime(processedSales);

      // Fetch top products
      const { data: topProductsData, error: productsError } = await supabase
        .from('sales_records')
        .select('product_name, product_code, total_price, quantity')
        .gte('sale_date', from)
        .lte('sale_date', to)
        .not('parent_item_name', 'is', null) // Exclude kit/combo parent records
        .order('total_price', { ascending: false })
        .limit(20); // Get more to aggregate properly

      if (productsError) throw productsError;

      const processedProducts = topProductsData
        .reduce((acc, sale) => {
          const existingProduct = acc.find(
            (p) => p.product_code === sale.product_code
          );
          if (existingProduct) {
            existingProduct.total_revenue += sale.total_price;
            existingProduct.total_quantity += sale.quantity;
          } else {
            acc.push({
              product_name: sale.product_name,
              product_code: sale.product_code,
              total_revenue: sale.total_price,
              total_quantity: sale.quantity,
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setTopProducts(processedProducts);

      // Calculate overall stats
      const uniqueOrders = new Set(dailySales.map((sale) => sale.order_number));
      const stats = {
        totalRevenue: dailySales.reduce(
          (sum, sale) => sum + sale.total_price,
          0
        ),
        totalOrders: uniqueOrders.size,
        totalProducts: dailySales.reduce((sum, sale) => sum + sale.quantity, 0),
      };
      stats.averageOrderValue =
        stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

      setSalesStats(stats);

      // Also fetch stock overview when dates change
      await fetchStockOverview();
    } catch (error) {
      console.error('Error fetching sales data:', error);
      alert('Failed to fetch sales data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, supabase, fetchStockOverview]);

  // Only fetch data when dates change and we have initial data to compare
  useEffect(() => {
    if (
      hasInitialData &&
      (startDate.toISOString().split('T')[0] !== defaultDateRange?.startDate ||
        endDate.toISOString().split('T')[0] !== defaultDateRange?.endDate)
    ) {
      fetchSalesData();
    }
  }, [startDate, endDate, hasInitialData, defaultDateRange, fetchSalesData]);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <h2 className='text-3xl font-bold'>Overview Dashboard</h2>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center'>
            <label className='text-sm font-medium mr-2'>From</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className='w-full border border-gray-300 px-3 py-2 rounded-md'
            />
          </div>
          <div className='flex items-center'>
            <label className='text-sm font-medium mr-2'>To</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className='w-full border border-gray-300 px-3 py-2 rounded-md'
            />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Revenue'
          value={salesStats.totalRevenue}
          loading={loading}
        />
        <StatCard
          title='Total Orders'
          value={salesStats.totalOrders}
          loading={loading}
        />
        <StatCard
          title='Average Order Value'
          value={salesStats.averageOrderValue}
          loading={loading}
        />
        <StatCard
          title='Total Products Sold'
          value={salesStats.totalProducts}
          loading={loading}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CustomCard>
          <CustomCardHeader>
            <CustomCardTitle>Sales Over Time</CustomCardTitle>
          </CustomCardHeader>
          <CustomCardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='sale_date' />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString('en-IN')}`
                  }
                />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='daily_revenue'
                  stroke='#8884d8'
                  name='Daily Revenue'
                />
              </LineChart>
            </ResponsiveContainer>
          </CustomCardContent>
        </CustomCard>

        <CustomCard>
          <CustomCardHeader>
            <CustomCardTitle>Top 10 Selling Products</CustomCardTitle>
          </CustomCardHeader>
          <CustomCardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart
                data={topProducts}
                layout='vertical'
                margin={{ left: 150 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  type='number'
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <YAxis
                  type='category'
                  dataKey='product_name'
                  width={150}
                  interval={0}
                />
                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString('en-IN')}`
                  }
                />
                <Legend />
                <Bar
                  dataKey='total_revenue'
                  fill='#82ca9d'
                  name='Total Revenue'
                />
              </BarChart>
            </ResponsiveContainer>
          </CustomCardContent>
        </CustomCard>
      </div>

      <CustomCard>
        <CustomCardHeader>
          <CustomCardTitle>Inventory Overview by Category</CustomCardTitle>
        </CustomCardHeader>
        <CustomCardContent>
          <ResponsiveContainer width='100%' height={400}>
            <BarChart
              data={stockOverview}
              layout='vertical'
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis type='number' />
              <YAxis
                type='category'
                dataKey='category_name'
                width={150}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                }}
              />
              <Legend />
              <Bar dataKey='total_stock' fill='#8884d8' name='Total Stock' />
            </BarChart>
          </ResponsiveContainer>
        </CustomCardContent>
      </CustomCard>
    </div>
  );
}
