import React from 'react';
import AdminSidebar from '../admin/AdminSidebar';
import '../../app/globals.css';

export default function AdminLayout({ children }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <div className='flex flex-1'>
        <AdminSidebar />
        <div className='flex-1'>
          {' '}
          {/* Set left margin to exactly match sidebar width */}
          <main className=''>{children}</main>
        </div>
      </div>
    </div>
  );
}
