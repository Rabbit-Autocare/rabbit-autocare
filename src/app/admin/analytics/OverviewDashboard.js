// components/admin/analytics/OverviewDashboard.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Pre-defined color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#00E396', '#FEB019', '#FF66C3'];

// Custom Card Component with a subtle hover effect
const CustomCard = ({ children, className }) => (
  <div className={`bg-white border rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-md ${className}`}>
    {children}
  </div>
);

const CustomCardHeader = ({ children, className }) => (
  <div className={`p-4 pb-2 ${className}`}>{children}</div>
);

const CustomCardTitle = ({ children, className }) => (
  <h3 className={`text-base font-semibold tracking-tight text-gray-700 ${className}`}>
    {children}
  </h3>
);

const CustomCardContent = ({ children, className }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

// Modified StatCard to conditionally show the rupee symbol
const StatCard = ({ title, value, subValue, loading }) => {
  const isCurrency = title.toLowerCase().includes('revenue') || title.toLowerCase().includes('value');
  const displayValue = isCurrency
    ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : Number(value).toLocaleString('en-IN');

  return (
    <CustomCard className='col-span-1'>
      <CustomCardHeader>
        <CustomCardTitle>{title}</CustomCardTitle>
      </CustomCardHeader>
      <CustomCardContent>
        {loading ? (
          <div className='animate-pulse'>
            <div className='h-7 bg-gray-200 rounded w-20'></div>
            <div className='h-4 bg-gray-200 rounded w-16 mt-2'></div>
          </div>
        ) : (
          <>
            <div className='text-2xl font-bold text-gray-800'>{displayValue}</div>
            {subValue && <div className='text-xs text-gray-500 mt-1'>{subValue}</div>}
          </>
        )}
      </CustomCardContent>
    </CustomCard>
  );
};

export default function OverviewDashboard({
  initialData,
  userAuth,
  defaultDateRange,
}) {
  const supabase = createSupabaseBrowserClient();

  const [salesOverTime, setSalesOverTime] = useState(initialData?.salesStats?.salesOverTime || []);
  const [topProducts, setTopProducts] = useState(initialData?.topProducts || []);
  const [salesStats, setSalesStats] = useState({
    totalRevenue: initialData?.salesStats?.totalRevenue || 0,
    totalOrders: initialData?.salesStats?.totalOrders || 0,
    averageOrderValue: initialData?.salesStats?.averageOrderValue || 0,
    totalProducts: initialData?.salesStats?.totalProducts || 0,
  });
  const [stockOverview, setStockOverview] = useState(initialData?.stockOverview || []);
  const [startDate, setStartDate] = useState(() => {
    return defaultDateRange?.startDate ? new Date(defaultDateRange.startDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();
  });
  const [endDate, setEndDate] = useState(() => {
    return defaultDateRange?.endDate ? new Date(defaultDateRange.endDate) : new Date();
  });
  const [loading, setLoading] = useState(false);
  const [hasInitialData] = useState(!!initialData);

  const fetchStockOverview = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_category_stock_overview');
      if (error) throw error;
      setStockOverview(data || []);
    } catch (error) {
      console.error('Error fetching stock overview:', error);
      // Removed alert for a cleaner user experience
    }
  }, [supabase]);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const from = startDate.toISOString().split('T')[0];
      const to = endDate.toISOString().split('T')[0];

      const { data: dailySales, error: salesError } = await supabase
        .from('sales_records')
        .select('sale_date, total_price, order_number, quantity, product_name, product_code')
        .gte('sale_date', from)
        .lte('sale_date', to)
        .order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      const salesByDate = dailySales.reduce((acc, sale) => {
        const date = sale.sale_date;
        acc[date] = (acc[date] || 0) + sale.total_price;
        return acc;
      }, {});

      setSalesOverTime(Object.entries(salesByDate).map(([date, total]) => ({
        sale_date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        daily_revenue: total,
      })));

      const productAggregation = dailySales.reduce((acc, sale) => {
        if (!sale.product_code) return acc;
        if (!acc[sale.product_code]) {
          acc[sale.product_code] = { product_name: sale.product_name, product_code: sale.product_code, total_revenue: 0, total_quantity: 0 };
        }
        acc[sale.product_code].total_revenue += sale.total_price;
        acc[sale.product_code].total_quantity += sale.quantity;
        return acc;
      }, {});

      setTopProducts(Object.values(productAggregation)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10)
        .map(p => ({ ...p, product_name: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '…' : p.product_name }))
      );

      const uniqueOrders = new Set(dailySales.map(sale => sale.order_number));
      const stats = {
        totalRevenue: dailySales.reduce((sum, sale) => sum + sale.total_price, 0),
        totalOrders: uniqueOrders.size,
        totalProducts: dailySales.reduce((sum, sale) => sum + sale.quantity, 0),
      };
      stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
      setSalesStats(stats);

      await fetchStockOverview();
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Removed alert for a cleaner user experience
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, supabase, fetchStockOverview]);

  useEffect(() => {
    if (hasInitialData && (startDate.toISOString().split('T')[0] !== defaultDateRange?.startDate || endDate.toISOString().split('T')[0] !== defaultDateRange?.endDate)) {
      fetchSalesData();
    }
  }, [startDate, endDate, hasInitialData, defaultDateRange, fetchSalesData]);

  // A styled custom tooltip for all charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const isCurrency = name.toLowerCase().includes('revenue');
      const formattedValue = isCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : `${Number(value).toLocaleString('en-IN')} units`;

      return (
        <div className="bg-white p-2.5 border border-gray-200 rounded-lg shadow-lg text-sm">
          <p className="font-bold text-gray-800">{label}</p>
          <p style={{ color: payload[0].fill || payload[0].stroke }}>{`${name}: ${formattedValue}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='p-4 space-y-4 bg-gray-50 min-h-screen'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <h2 className='text-2xl font-bold text-gray-800'>Overview Dashboard</h2>
        <div className='flex items-center space-x-2'>
          <DatePicker selected={startDate} onChange={date => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} className='w-32 border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-500' dateFormat="dd/MM/yyyy" />
          <DatePicker selected={endDate} onChange={date => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} className='w-32 border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-500' dateFormat="dd/MM/yyyy" />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard title='Total Revenue' value={salesStats.totalRevenue} loading={loading} />
        <StatCard title='Total Orders' value={salesStats.totalOrders} loading={loading} />
        <StatCard title='Average Order Value' value={salesStats.averageOrderValue} loading={loading} />
        <StatCard title='Total Products Sold' value={salesStats.totalProducts} loading={loading} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
        <div className='lg:col-span-3'>
          <CustomCard>
            <CustomCardHeader><CustomCardTitle>Sales Over Time</CustomCardTitle></CustomCardHeader>
            <CustomCardContent>
              <ResponsiveContainer width='100%' height={250}>
                <LineChart data={salesOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke="#e0e0e0" />
                  <XAxis dataKey='sale_date' tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis tickFormatter={value => `₹${value / 1000}k`} tick={{ fontSize: 11 }} stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                  <Line type='monotone' dataKey='daily_revenue' name="Daily Revenue" stroke='#8884d8' strokeWidth={2.5} dot={{ r: 4, fill: '#8884d8' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CustomCardContent>
          </CustomCard>
        </div>
        <div className='lg:col-span-2'>
          <CustomCard>
            <CustomCardHeader><CustomCardTitle>Inventory by Category</CustomCardTitle></CustomCardHeader>
            <CustomCardContent>
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={stockOverview} layout='vertical' margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke="#e0e0e0" />
                  <XAxis type='number' tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis type='category' dataKey='category_name' width={80} interval={0} tick={{ fontSize: 10 }} stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey='total_stock' name="Total Stock">
                    {stockOverview.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CustomCardContent>
          </CustomCard>
        </div>
      </div>

      <CustomCard>
        <CustomCardHeader><CustomCardTitle>Top 10 Selling Products by Revenue</CustomCardTitle></CustomCardHeader>
        <CustomCardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
              <XAxis type="number" tickFormatter={value => `₹${value / 1000}k`} tick={{ fontSize: 11 }} stroke="#666" />
              <YAxis type="category" dataKey="product_name" width={120} interval={0} tick={{ fontSize: 11 }} stroke="#666" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(240, 240, 240, 0.6)' }}/>
              <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="total_revenue" name="Total Revenue" barSize={20}>
                  {topProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CustomCardContent>
      </CustomCard>
    </div>
  );
}
