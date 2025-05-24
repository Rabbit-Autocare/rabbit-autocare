"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Shop categories - easy to update
const shopCategories = [
  { name: "Car Interior", href: "/shop/car-interior", image: "/placeholder.svg?height=200&width=300" },
  { name: "Car Interior", href: "/shop/car-interior-2", image: "/placeholder.svg?height=200&width=300" },
  { name: "Car Interior", href: "/shop/car-interior-3", image: "/placeholder.svg?height=200&width=300" },
  { name: "Car Interior", href: "/shop/car-interior-4", image: "/placeholder.svg?height=200&width=300" },
]

export default function BottomNavbar() {
  const [isShopOpen, setIsShopOpen] = useState(false)

  return (
    <>
      <div className="border-b py-2">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-1 font-medium"
              onClick={() => setIsShopOpen(!isShopOpen)}
            >
              SHOP
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
                className={cn("transition-transform", isShopOpen ? "rotate-180" : "")}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Button>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for shirts/tees/clothes or any other product..."
                className="w-full pl-3 pr-10 py-1 text-sm border rounded-md"
              />
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
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
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="ghost" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="sr-only">Settings</span>
            </Button>
            <Button variant="ghost" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Full-width shop dropdown */}
      {isShopOpen && (
        <div className="absolute left-0 right-0 bg-white shadow-lg z-50 border-b">
          <div className="container mx-auto py-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {shopCategories.map((category, index) => (
                <Link key={index} href={category.href} className="block group">
                  <div className="overflow-hidden rounded-md">
                    <div className="relative aspect-[3/2] bg-gray-100">
                      <img
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="bg-black text-white py-2 px-4 text-center">
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
