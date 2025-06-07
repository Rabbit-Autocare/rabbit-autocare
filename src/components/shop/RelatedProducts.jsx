"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ProductService } from "@/lib/service/productService"

export default function RelatedProducts({ categoryName, currentProductId, limit = 4 }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        setLoading(true)

        // Fetch products from the same category
        const response = await ProductService.getProductsByCategory(
          categoryName || "all",
          { limit: limit + 1 }, // Fetch one extra to filter out current product
        )

        // Filter out the current product and limit to requested number
        const filteredProducts = ProductService.extractProducts(response)
          .filter((product) => product.product_code !== currentProductId)
          .slice(0, limit)

        setProducts(filteredProducts)
      } catch (error) {
        console.error("Error fetching related products:", error)
      } finally {
        setLoading(false)
      }
    }

    if (categoryName) {
      fetchRelatedProducts()
    }
  }, [categoryName, currentProductId, limit])

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">You might also like</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="group">
            <Link href={`/shop/product/${product.product_code}`} className="block">
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                <Image
                  src={product.main_image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
              <p className="text-sm mt-1">
                {product.minPrice === product.maxPrice
                  ? formatPrice(product.minPrice)
                  : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`}
              </p>
            </Link>
            <button className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
              View Product
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
