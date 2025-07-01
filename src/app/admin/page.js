import '../../app/globals.css';
import React from 'react';
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
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import AdminLayout from '@/components/layouts/AdminLayout';
import AnalyticsTabs from './analytics/AnalyticsTabs';

/**
 * Admin Dashboard Server Component
 * Displays analytics, charts and key business metrics
 * Uses SSR for faster loading and authentication verification
 */
export default async function AdminPage({ searchParams }) {
  // Verify admin authentication on server side
  const authData = await verifyAdminAuth();

  // Get date range from search params or use defaults
  const startDate =
    searchParams?.startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate =
    searchParams?.endDate || new Date().toISOString().split('T')[0];

  // Fetch initial dashboard data on server side
  const dashboardData = await fetchAdminDashboardData(startDate, endDate);

  return (
    <AdminLayout>
      <AnalyticsTabs
        initialData={dashboardData}
        userAuth={authData}
        defaultDateRange={{ startDate, endDate }}
      />
    </AdminLayout>
  );
}

// 'use client'
// import AnalyticsTabs from './analytics/AnalyticsTabs';
// import "../../app/globals.css"
// export default function AdminAnalyticsPage() {
//   return <AnalyticsTabs />;
// }
