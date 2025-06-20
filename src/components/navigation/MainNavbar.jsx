'use client';

import TopNavbar from './TopNavbar';
import MiddleNavbar from './MiddleNavbar';
import BottomNavbar from './BottomNavbar';
import MobileNavbar from './MobileNavbar';

export default function MainNavbar() {
  return (
    <header className='w-full relative'>
      {/* Desktop Navbar */}
      <div className='hidden md:block'>
        <TopNavbar />
        <MiddleNavbar />
        <BottomNavbar />
      </div>

      {/* Mobile Navbar */}
      <div className='md:hidden'>

      </div>
    </header>
  );
}
