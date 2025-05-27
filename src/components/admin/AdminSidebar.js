'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Add-Combo', path: '/admin/combo' },
    { name: 'Combos', path: '/admin/combos' },
    { name: 'Coupons', path: '/admin/coupons' },
  ];

  return (
    <div className='w-64 bg-gray-800 text-white h-auto min-h-screen p-6'>
      <h2 className='text-xl font-semibold'>Admin Dashboard</h2>
      <div className='mt-6 space-y-2'>
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block p-2 rounded hover:bg-gray-700 ${
              router.pathname === item.path ? 'bg-gray-700' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
