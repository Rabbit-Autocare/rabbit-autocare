// In 'UserSidebar.js'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// You might not need createSupabaseBrowserClient here anymore for logout,
// but it's good practice to clear the client state as well.
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import '@/app/globals.css';
import { FaSignOutAlt } from 'react-icons/fa';


export default function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    // 1. Call your server endpoint to delete the httpOnly cookie
    await fetch('/api/auth/signout', {
      method: 'POST',
    });

    // 2. (Optional but Recommended) Sign out of the client-side instance
    //    to clear any local state immediately.
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    // 3. For the App Router, it's best to use router.refresh() to ensure
    //    all server components are re-fetched and caches are cleared.
    //    Then, redirect the user.
    router.refresh();
    router.push('/login');
  };

  // ... rest of your component remains the same
  const menu = [
    { label: 'My Profile', href: '/user' },
    { label: 'Orders', href: '/user/orders' },
    { label: 'Addresses', href: '/user/address-book' },
    { label: 'Coupons', href: '/user/coupons' },
  ];


  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-white shadow-lg min-h-screen rounded-l-2xl flex-col relative">
        <div>
          <nav className="flex flex-col gap-2 mt-6 px-2">
            {menu.map((item) => {
              const isActive = item.href === '/user'
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const isMyProfile = item.label === 'My Profile';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3 rounded-[100px] transition-all font-medium text-base
                    ${isActive ? 'bg-[#601e8d] text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'}
                    ${isMyProfile ? 'md:mt-12' : ''}
                  `}
                  style={isActive ? { fontWeight: 700 } : {}}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Logout Button */}
            <div className="px-2 mt-4">
              <button
                onClick={handleLogout} // This now calls the corrected function
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-base font-semibold transition-all"
              >
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile/Tablet Sidebar ... (no changes needed here) */}
      <div className="md:hidden bg-white my-10">
        {/* ... */}
        <button
            onClick={handleLogout} // This also calls the corrected function
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm"
        >
          <FaSignOutAlt className="text-sm flex-shrink-0" />
          <span className="">Log Out</span>
        </button>
        {/* ... */}
      </div>
    </>
  );
}

