'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../globals.css';
import Papa from 'papaparse';

function getVariantDisplayText(variant) {
    if (!variant) return '';
    const parts = [];
    if (variant.gsm) parts.push(`${variant.gsm} GSM`);
    if (variant.size) parts.push(variant.size);
    if (variant.color) parts.push(variant.color);
    if (variant.color_hex) parts.push(variant.color_hex);
    if (variant.quantity && variant.unit) parts.push(`${variant.quantity}${variant.unit}`);
    return parts.filter(Boolean).join(', ');
}

export default function SalesDashboard() {
    const [salesData, setSalesData] = useState([]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [sortConfig, setSortConfig] = useState({ key: 'sale_date', direction: 'desc' });
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        fetchSalesData();
    }, [startDate, endDate, currentPage, sortConfig]);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            const from = startDate.toISOString().split('T')[0];
            const to = endDate.toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('sales_records')
                .select('*')
                .gte('sale_date', from)
                .lte('sale_date', to)
                .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
            if (error) throw error;
            setSalesData(data || []);
            const total = (data || []).reduce((sum, record) => sum + (record.total_price || 0), 0);
            setTotalAmount(total);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            alert('Failed to fetch sales data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleDownloadCsv = async () => {
        setDownloading(true);
        try {
            const from = startDate.toISOString().split('T')[0];
            const to = endDate.toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('sales_records')
                .select('*')
                .gte('sale_date', from)
                .lte('sale_date', to)
                .order('sale_date', { ascending: false });
            if (error) throw error;
            if (!data || data.length === 0) {
                alert('No sales data available for the selected date range.');
                return;
            }
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Sales Records</h2>
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

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <div className="text-lg font-semibold">
                        Total Amount: {formatCurrency(totalAmount)}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('sale_date')}>
                                    Date {sortConfig.key === 'sale_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('product_name')}>
                                    Product {sortConfig.key === 'product_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Code
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Variant
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_price')}>
                                    Total {sortConfig.key === 'total_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parent (Kit/Combo)
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : salesData.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                                        No sales records found for the selected date range.
                                    </td>
                                </tr>
                            ) : (
                                salesData.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(record.sale_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.order_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium">{record.product_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {record.product_code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {record.variant_details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(record.unit_price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(record.total_price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.sale_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.parent_item_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.category_name || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, salesData.length)} entries
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={salesData.length < itemsPerPage}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
