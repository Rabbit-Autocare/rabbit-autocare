import React from 'react';
import UserSidebar from '../user/UserSidebar';
import MainNavbar from '@/components/navigation/MainNavbar';
import '../../app/globals.css';

export default function UserLayout({ children }) {
  return (
    <div className='flex flex-col md:flex-row'>
      <UserSidebar />
      <main className='flex-1 md:p-6'>{children}</main>
    </div>
  );
}
