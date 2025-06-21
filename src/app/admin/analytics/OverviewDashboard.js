// components/admin/analytics/OverviewDashboard.js
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-transform"><path d="m6 9 6 6 6-6"/></svg>
);

const ChevronUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-transform"><path d="m18 15-6-6-6 6"/></svg>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#FF66C3', '#82ca9d', '#ffc658'];

export default function OverviewDashboard() {
    const [overviewData, setOverviewData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);

    useEffect(() => {
        const fetchStockOverview = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_category_stock_overview');
                if (error) throw error;
                setOverviewData(data || []);
            } catch (error) {
                console.error('Error fetching stock overview:', error);
                alert('Failed to fetch stock overview: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStockOverview();
    }, []);

    const toggleCategory = (categoryName) => {
        if (expandedCategory === categoryName) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(categoryName);
        }
    };

    // Transform data for the stacked bar chart
    const { chartData, productKeys } = useMemo(() => {
        if (!overviewData || overviewData.length === 0) {
            return { chartData: [], productKeys: [] };
        }

        const productKeysSet = new Set();
        const transformedData = overviewData.map(category => {
            const categoryData = { name: category.category_name };
            category.products_stock.forEach(product => {
                categoryData[product.name] = product.total_stock;
                productKeysSet.add(product.name);
            });
            return categoryData;
        });

        // Sort by total stock per category
        transformedData.sort((a, b) => {
            const totalA = Object.values(a).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
            const totalB = Object.values(b).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
            return totalB - totalA;
        });

        return { chartData: transformedData, productKeys: Array.from(productKeysSet) };
    }, [overviewData]);

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Inventory Overview by Category</h2>
            </div>

            {chartData.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No inventory data found to display.</p>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                     <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 50, bottom: 5, }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} interval={0} />
                            <Tooltip
                                cursor={{fill: 'rgba(240, 240, 240, 0.5)'}}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                            />
                            <Legend />
                            {productKeys.map((key, index) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
