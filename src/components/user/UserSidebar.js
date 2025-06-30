'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../../app/globals.css';
import { FaSignOutAlt } from 'react-icons/fa';

export default function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menu = [
    { label: 'My Profile', href: '/user' },
    { label: 'Orders', href: '/user/orders' },
    { label: 'Addresses', href: '/user/address-book' },
    { label: 'Coupons', href: '/user/coupons' },
  ];

  return (
    <>
      {/* Desktop Sidebar - Vertical Layout */}
      <aside className="hidden md:flex w-60 bg-white shadow-lg min-h-screen rounded-l-2xl flex-col relative">
        <div>
          <nav className="flex flex-col gap-2 mt-6 px-2">
            {menu.map((item) => {
              const active = pathname === item.href;
              const isMyProfile = item.label === 'My Profile';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3 rounded-[100px] transition-all font-medium text-base
                    ${active ? 'bg-[#601e8d] text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'}
                    ${isMyProfile ? 'md:mt-12' : ''}
                  `}
                  style={active ? { fontWeight: 700 } : {}}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Logout Button - Now positioned below menu items */}
            <div className="px-2 mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-base font-semibold transition-all"
              >
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile/Tablet Sidebar - Horizontal Layout */}
      <div className="md:hidden bg-white my-10">
        <div className="flex flex-row items-center justify-between w-full">
          {/* Navigation Menu - Horizontal Scrollable */}
          <nav
            className="flex flex-row items-center gap-3 px-4 py-3 overflow-x-auto flex-1 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {menu.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center px-4 py-2 rounded-full transition-all font-medium text-sm whitespace-nowrap flex-shrink-0 min-w-fit border
                    ${active
                      ? 'bg-[#601e8d] text-white shadow-md border-[#601e8d]'
                      : 'text-gray-700 hover:bg-purple-50 border-gray-200 bg-white'
                    }
                  `}
                  style={active ? { fontWeight: 700 } : {}}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button - Always Visible */}
          <div className="flex-shrink-0 px-3 py-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm"
            >
              <FaSignOutAlt className="text-sm flex-shrink-0" />
              <span className="">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
