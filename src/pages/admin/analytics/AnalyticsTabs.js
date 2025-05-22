// components/admin/analytics/AnalyticsTabs.js
'use client';
import React, { useState } from 'react';
 import OverviewDashboard from './OverviewDashboard';
import StockDashboard from './StockDashboard';
import SalesDashboard from './SalesDashboard';
import ReportsDashboard from './ReportsDashboard';

const TABS = ['Overview', 'Stock', 'Sales', 'Reports'];

export default function AnalyticsTabs() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="max-w-screen-xl mx-auto py-6 px-4">
      <div className="flex gap-4 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 transition-all duration-200 font-semibold text-lg ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-blue-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Overview' && <OverviewDashboard />}
        {activeTab === 'Stock' && <StockDashboard />}
        {activeTab === 'Sales' && <SalesDashboard />}
        {activeTab === 'Reports' && <ReportsDashboard />}
      </div>
    </div>
  );
}
