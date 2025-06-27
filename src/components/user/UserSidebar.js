'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../../app/globals.css';
import { FaUser, FaBoxOpen, FaMapMarkerAlt, FaGift, FaSignOutAlt } from 'react-icons/fa';

export default function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menu = [
    { label: 'My Profile', href: '/user', icon: <FaUser /> },
    { label: 'Orders', href: '/user/orders', icon: <FaBoxOpen /> },
    { label: 'Addresses', href: '/user/address-book', icon: <FaMapMarkerAlt /> },
    { label: 'Coupons', href: '/user/coupons', icon: <FaGift /> },
  ];

  return (
    <aside className="w-60 bg-white shadow-lg min-h-screen rounded-l-2xl flex flex-col justify-between">
      <div>
        <div className="text-xl font-bold text-center py-8 border-b">My Profile</div>
        <nav className="flex flex-col gap-2 mt-6 px-2">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 rounded-l-2xl transition-all font-semibold text-base
                  ${active ? 'bg-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'}
                `}
                style={active ? { fontWeight: 700 } : {}}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-base font-semibold transition-all"
        >
          <FaSignOutAlt /> Log Out
        </button>
      </div>
    </aside>
  );
}
