// components/admin/analytics/AnalyticsTabs.js
'use client';
import React, { useState } from 'react';
import OverviewDashboard from './OverviewDashboard';
import SalesDashboard from './SalesDashboard';
// import StockDashboard from './StockDashboard';
import ReportsDashboard from './ReportsDashboard';

const tabs = [
  { name: 'Overview', component: OverviewDashboard },
  { name: 'Sales', component: SalesDashboard },
  // { name: 'Stock', component: StockDashboard },
  { name: 'Reports', component: ReportsDashboard },
];

export default function AnalyticsTabs({
  initialData,
  userAuth,
  defaultDateRange,
}) {
  const [activeTab, setActiveTab] = useState('Overview');

  const ActiveComponent =
    tabs.find((tab) => tab.name === activeTab)?.component || OverviewDashboard;

  return (
    <div>
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8 px-6' aria-label='Tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`${
                activeTab === tab.name
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div className='pt-6'>
        <ActiveComponent
          initialData={initialData}
          userAuth={userAuth}
          defaultDateRange={defaultDateRange}
        />
      </div>
    </div>
  );
}
