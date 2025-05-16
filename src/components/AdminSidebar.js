'use client'
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminSidebar() {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Products', path: '/admin/product' },
    { name: 'Add Product', path: '/admin/add-product' },
    { name: 'Profile', path: '/admin/profile' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white fixed top-0 left-0 bottom-0 p-6">
      <h2 className="text-xl font-semibold">Admin Sidebar</h2>
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
  );
}
