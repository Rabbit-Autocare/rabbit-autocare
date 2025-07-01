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
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import AdminLayout from '@/components/layouts/AdminLayout';
import AnalyticsTabs from './analytics/AnalyticsTabs';

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
export default function AdminPage() {
  return (
    <AdminLayout>
      <AnalyticsTabs />
    </AdminLayout>
  );
}

// 'use client'
// import AnalyticsTabs from './analytics/AnalyticsTabs';
// import "../../app/globals.css"
// export default function AdminAnalyticsPage() {
//   return <AnalyticsTabs />;
// }
