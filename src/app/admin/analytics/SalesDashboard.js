'use client'
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Line, Bar, Pie } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../app/globals.css"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

const SalesDashboard = () => {
  // States
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [totalSales, setTotalSales] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fetch data on date change
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Summary
      const { data: summary, error: summaryError } = await supabase.rpc("get_sales_summary", {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      });

      if (summaryError) throw summaryError;

      // summary is an array with one object
      const { total_sales, orders_count, average_order_value } = summary[0];
      setTotalSales(Number(total_sales));
      setOrdersCount(Number(orders_count));
      setAverageOrderValue(Number(average_order_value));

      // Sales Over Time
      const { data: overTime, error: timeError } = await supabase.rpc("get_sales_over_time", {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      });

      if (timeError) throw timeError;

      setSalesOverTime(
        overTime.map((o) => ({
          date: o.order_date,
          amount: Number(o.total),
        }))
      );

      // Top Products
      const { data: top, error: topErr } = await supabase.rpc("get_top_products", {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      });

      if (topErr) throw topErr;

      setTopProducts(
        top.map((t) => ({
          name: t.product_name,
          unitsSold: Number(t.units_sold),
        }))
      );

      // Sales by Category
      const { data: catData, error: catErr } = await supabase.rpc("get_sales_by_category", {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      });

      if (catErr) throw catErr;

      setSalesByCategory(
        catData.map((c) => ({
          category: c.category || "Other",
          amount: Number(c.total_sales),
        }))
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data.");
    }

    setLoading(false);
  };

  // Chart Configs
  const salesOverTimeData = {
    labels: salesOverTime.map((s) => s.date),
    datasets: [
      {
        label: "Sales (₹)",
        data: salesOverTime.map((s) => s.amount),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const topProductsData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: "Units Sold",
        data: topProducts.map((p) => p.unitsSold),
        backgroundColor: "#ef4444",
        borderRadius: 4,
      },
    ],
  };

  const salesByCategoryData = {
    labels: salesByCategory.map((c) => c.category),
    datasets: [
      {
        label: "Sales by Category (₹)",
        data: salesByCategory.map((c) => c.amount),
        backgroundColor: ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"],
        hoverOffset: 12,
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Sales Dashboard</h1>

        {/* Date Pickers */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          <div className="w-full sm:w-64">
            <label className="block font-medium mb-1 text-gray-700">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              maxDate={new Date()}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div className="w-full sm:w-64">
            <label className="block font-medium mb-1 text-gray-700">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              maxDate={new Date()}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-blue-100 p-6 rounded shadow text-center">
                <h2 className="text-xl font-semibold mb-2">Total Sales</h2>
                <p className="text-3xl font-bold text-blue-700">₹ {totalSales.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-6 rounded shadow text-center">
                <h2 className="text-xl font-semibold mb-2">Orders Count</h2>
                <p className="text-3xl font-bold text-green-700">{ordersCount}</p>
              </div>
              <div className="bg-purple-100 p-6 rounded shadow text-center">
                <h2 className="text-xl font-semibold mb-2">Avg Order Value</h2>
                <p className="text-3xl font-bold text-purple-700">₹ {averageOrderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Sales Over Time</h3>
                <Line data={salesOverTimeData} />
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Top Selling Products</h3>
                <Bar data={topProductsData} />
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Sales by Category</h3>
                <Pie data={salesByCategoryData} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
