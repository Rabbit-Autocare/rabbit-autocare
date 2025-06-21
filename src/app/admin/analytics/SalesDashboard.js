'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../globals.css';
import Papa from 'papaparse';

// Custom Card Component
const CustomCard = ({ children, className }) => (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
        {children}
    </div>
);

const CustomCardHeader = ({ children, className }) => (
    <div className={`p-6 pb-2 ${className}`}>
        {children}
    </div>
);

const CustomCardTitle = ({ children, className }) => (
    <h3 className={`text-lg font-semibold tracking-tight ${className}`}>
        {children}
    </h3>
);

const CustomCardContent = ({ children, className }) => (
    <div className={`p-6 pt-0 ${className}`}>
        {children}
    </div>
);


export default function SalesDashboard() {
    const [salesOverTime, setSalesOverTime] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchSalesData();
    }, [startDate, endDate]);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            const from = startDate.toISOString();
            const to = endDate.toISOString();

            // Fetch Sales Over Time
            const { data: sotData, error: sotError } = await supabase.rpc('get_sales_over_time', {
                start_date: from,
                end_date: to,
            });
            if (sotError) throw sotError;
            setSalesOverTime(sotData.map(d => ({ ...d, sale_date: new Date(d.sale_date).toLocaleDateString() })) || []);

            // Fetch Top Selling Products
            const { data: tpData, error: tpError } = await supabase.rpc('get_top_selling_products', {
                limit_count: 10,
                start_date: from,
                end_date: to,
            });
            if (tpError) throw tpError;
            setTopProducts(tpData || []);

        } catch (error) {
            console.error('Error fetching sales data:', error);
            alert('Failed to fetch sales data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        setDownloading(true);
        try {
            const { data, error } = await supabase.rpc('get_sales_report_data', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
            });

            if (error) throw error;

            if (!data || data.length === 0) {
                alert('No sales data available for the selected date range.');
                return;
            }

            // Flatten the address object for better CSV readability
            const flattenedData = data.map(row => ({
                ...row,
                shipping_name: row.shipping_address?.name,
                shipping_phone: row.shipping_address?.phone,
                shipping_address_line1: row.shipping_address?.address_line1,
                shipping_address_line2: row.shipping_address?.address_line2,
                shipping_city: row.shipping_address?.city,
                shipping_state: row.shipping_address?.state,
                shipping_postal_code: row.shipping_address?.postal_code,
                shipping_country: row.shipping_address?.country,
            }));

            // Remove the original address object
            flattenedData.forEach(row => delete row.shipping_address);


            const csv = Papa.unparse(flattenedData, {
                header: true,
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const from = startDate.toISOString().split('T')[0];
            const to = endDate.toISOString().split('T')[0];
            link.setAttribute('download', `sales_report_${from}_to_${to}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading CSV:', error);
            alert('Failed to download sales report: ' + error.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Sales Analytics</h2>
                <div className="flex items-center space-x-4 flex-wrap">
                    <button
                        onClick={handleDownloadCsv}
                        disabled={downloading}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {downloading ? 'Downloading...' : 'Download CSV'}
                    </button>
                    <div className="flex items-center">
                        <label className="text-sm font-medium mr-2">From</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="text-sm font-medium mr-2">To</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                        />
                    </div>
                </div>
            </div>

            <CustomCard>
                <CustomCardHeader>
                    <CustomCardTitle>Sales Over Time</CustomCardTitle>
                </CustomCardHeader>
                <CustomCardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sale_date" />
                            <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                            <Legend />
                            <Line type="monotone" dataKey="daily_revenue" stroke="#8884d8" name="Daily Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </CustomCardContent>
            </CustomCard>

            <CustomCard>
                <CustomCardHeader>
                    <CustomCardTitle>Top 10 Selling Products (by Revenue)</CustomCardTitle>
                </CustomCardHeader>
                <CustomCardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={topProducts} layout="vertical" margin={{ left: 150 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}k`} />
                            <YAxis type="category" dataKey="product_name" width={150} interval={0} />
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                            <Legend />
                            <Bar dataKey="total_revenue" fill="#82ca9d" name="Total Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </CustomCardContent>
            </CustomCard>
        </div>
    );
}
