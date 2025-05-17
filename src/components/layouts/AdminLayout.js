import React from 'react';
import AdminSidebar from '../admin/AdminSidebar';
import MainNavbar from '../MainNavbar';
import '../../app/globals.css';

export default function AdminLayout({ children }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <MainNavbar />
      <div className='flex flex-1'>
        <AdminSidebar />
        <main className='flex-1 p-6 ml-0 md:ml-64'>{children}</main>
      </div>
    </div>
  );
}
