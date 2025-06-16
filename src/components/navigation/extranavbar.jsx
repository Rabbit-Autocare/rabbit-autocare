'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { CategoryService } from '@/lib/service/microdataService';

const defaultCategories = [
  {
    name: 'Kits & Combos',
    href: '/shop/kits-combos',
    image: '/placeholder.svg?height=200&width=300',
  },
];

export default function ExtraNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const fetched = await CategoryService.getCategories();
        const fetchedArray = Array.isArray(fetched.data) ? fetched.data : [];

        const formatted = [
          ...fetchedArray.map((cat) => ({
            name: cat.name,
            href: `/shop/${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
            image: cat.image || '/placeholder.svg?height=200&width=300',
          })),
          defaultCategories[0],
        ];
        setCategories(formatted);
      } catch (err) {
        console.error('Category fetch error:', err);
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <header className="w-full z-40 bg-trasparent transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo and SHOP */}
        <div className="flex items-center space-x-6 relative">
          <Link href="/">
            <div className="text-2xl font-black flex items-center space-x-1">
              <img src="/assets/RabbitLogo.png" alt="Rabbit" className="w-[197px] h-[60px]" />
            </div>
          </Link>

          <div
            className="text-sm font-semibold cursor-pointer relative"
            onMouseEnter={() => setIsShopOpen(true)}
            onMouseLeave={() => setIsShopOpen(false)}
          >
            <button className="flex items-center gap-1 font-medium text-sm cursor-pointer">
              SHOP
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ease-in-out ml-1 ${
                  isShopOpen ? 'rotate-180' : ''
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side: Search, Login, Cart, Filters */}
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 cursor-pointer" />
          {isLoggedIn ? (
            <>
              <SlidersHorizontal className="w-5 h-5 cursor-pointer" />
              <ShoppingCart className="w-5 h-5 cursor-pointer" />
            </>
          ) : (
            <Link href="/login">
              <button className="px-4 py-1 border-2 border-black rounded-full text-sm font-semibold hover:bg-black hover:text-white transition">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* SHOP Dropdown */}
      <div
        className={`absolute left-0 right-0 bg-white shadow-lg z-50 border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isShopOpen ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        onMouseEnter={() => setIsShopOpen(true)}
        onMouseLeave={() => setIsShopOpen(false)}
      >
        <div className="w-full py-8 px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/2] rounded-lg"></div>
                  <div className="h-8 bg-gray-200 mt-2 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="block group"
                  onClick={() => setIsShopOpen(false)}
                >
                  <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="relative aspect-[3/2] bg-gray-100">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="bg-black text-white py-3 px-4 text-center">
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
