import React from 'react';
import UserSidebar from '../user/UserSidebar';
import MainNavbar from '@/components/navigation/MainNavbar';
import '../../app/globals.css';

export default function UserLayout({ children }) {
  return (
    <div className='flex flex-1'>
      <UserSidebar />
      <main className='flex-1 p-6'>{children}</main>
    </div>
  );
}
