'use client';

import React from 'react';

export default function ReportsDashboard() {
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold">Reports</h2>
            <div className="mt-6 flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-500">
                        Reporting features are coming soon.
                    </p>
                    <p className="mt-2 text-gray-400">
                        This section will contain downloadable reports for sales, inventory, and customers.
                    </p>
                </div>
            </div>
        </div>
    );
}
