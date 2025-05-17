import React from 'react';
import UserSidebar from '../user/UserSidebar';
import MainNavbar from '../MainNavbar';
import '../../app/globals.css';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <div className="flex flex-1">
        <UserSidebar />
        <main className="flex-1 p-6 ml-0 md:ml-60">
          {children}
        </main>
      </div>
    </div>
  );
}