"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext"; // Import from CartContext
import CartDrawer from "@/components/cart/CartDrawer";
import { ProductService } from "@/lib/service/productService";
import Image from 'next/image';

// Default shop categories including only Kits & Combos
const defaultCategories = [
  {
    name: "Kits & Combos",
    href: "/shop/kits-combos",
    image: "/placeholder.svg?height=200&width=300",
  },
];

// Coupons data
const coupons = [
  {
    code: "WELCOME20",
    description: "20% off on first order",
    discount: "20% OFF",
  },
  {
    code: "BULK50",
    description: "50% off on bulk orders",
    discount: "50% OFF",
  },
  {
    code: "FREESHIP",
    description: "Free shipping on orders above ₹999",
    discount: "FREE SHIPPING",
  },
  {
    code: "SAVE30",
    description: "30% off on car care combo",
    discount: "30% OFF",
  },
];

export default function BottomNavbar() {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  // Use cart context
  const { openCart, cartCount } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        console.log("Attempting to fetch categories...");
        const fetchedData = await ProductService.getCategories();
        console.log("Fetched data:", fetchedData);

        // Assume categories are in fetchedData.data; fallback to empty array if not
        const fetchedCategoriesArray = Array.isArray(fetchedData.data) ? fetchedData.data : [];

        // Transform categories to match our format and add Kits & Combos
        const transformedCategories = [
          ...fetchedCategoriesArray.map(cat => ({
            name: cat.name,
            href: `/shop/${cat.name}`,
            image: cat.image || "/placeholder.svg?height=200&width=300",
          })),
          defaultCategories[0], // Kits & Combos
        ];
        console.log("Transformed categories:", transformedCategories);
        setCategories(transformedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories if fetch fails
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
        console.log("Category fetching finished.");
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <div className="border-b border-gray-200 py-3 bg-white relative z-40">
        <div className="container mx-auto flex justify-between items-center px-6">
          {/* Desktop Shop Button */}
          <div className="relative">
            <button
              className="flex items-center gap-1 font-medium text-sm hover:bg-transparent p-0 h-auto bg-transparent border-none cursor-pointer transition-colors"
              onMouseEnter={() => setIsShopOpen(true)}
              onMouseLeave={() => setIsShopOpen(false)}
            >
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
                className={`transition-transform duration-200 ease-in-out ml-1 ${isShopOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Search Bar with bottom border only */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="search"
                placeholder="Search for microfiber clothes or any other product..."
                className="w-full pl-4 pr-12 py-2.5 text-sm border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="sr-only">Search</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Coupons icon with hover */}
            <div className="relative">
              <button
                className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
                onMouseEnter={() => setIsCouponsOpen(true)}
                onMouseLeave={() => setIsCouponsOpen(false)}
              >
                <div className="relative w-6 h-6">
                  <Image
                    src="/icons/coupons.svg"
                    alt="Coupons"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="sr-only">Coupons</span>
              </button>
            </div>

            {/* Shine icon (wish list) */}
            <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
              <div className="relative w-6 h-6">
                <Image
                  src="/icons/shine.svg"
                  alt="Shine List"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="sr-only">Shine List</span>
            </button>

            {/* Cart icon */}
            <button
              onClick={openCart}
              className="relative h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
            >
              <div className="relative w-6 h-6">
                <Image
                  src="/icons/cart.svg"
                  alt="Cart"
                  fill
                  className="object-contain"
                />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Shop dropdown with hover */}
      <div
        className={`absolute left-0 right-0 bg-white shadow-lg z-30 border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isShopOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        onMouseEnter={() => setIsShopOpen(true)}
        onMouseLeave={() => setIsShopOpen(false)}
      >
        <div className="container mx-auto py-8 px-6">
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
                      <Image
                        src={category.image}
                        alt={category.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                        fill
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

      {/* Coupons dropdown with hover */}
      <div
        className={`absolute right-6 top-full bg-white shadow-lg z-30 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-80 ${
          isCouponsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        onMouseEnter={() => setIsCouponsOpen(true)}
        onMouseLeave={() => setIsCouponsOpen(false)}
      >
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-4">Available Coupons</h3>
          <div className="space-y-3">
            {coupons.map((coupon, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{coupon.code}</div>
                  <div className="text-xs text-gray-600">
                    {coupon.description}
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  {coupon.discount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
