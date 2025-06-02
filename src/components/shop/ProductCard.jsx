"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, ShoppingCart } from 'lucide-react'

export default function ProductCard({ product }) {
  const router = useRouter()
  const [hasImageError, setHasImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)

  const handleImageError = () => {
    setHasImageError(true)
  }

  // Calculate min and max prices from variants
  const prices = product.variants?.map((v) => v.price) || []
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0

  // Get the first image URL from product images array
  const rawImageUrl = product.image && product.image.length > 0 ? product.image[0] : null

  // Validate and sanitize the image URL
  const getValidImageUrl = (url) => {
    if (!url) return null

    try {
      // If it's already a valid absolute URL, return it
      new URL(url)
      return url
    } catch {
      // If it's a relative URL or invalid, try to make it absolute
      if (typeof url === "string" && url.trim()) {
        // If it's a path to Supabase storage
        if (!url.startsWith("http") && !url.startsWith("/")) {
          return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${url}`
        }
        // If it starts with /, treat as absolute path
        if (url.startsWith("/")) {
          return url
        }
      }
      return null
    }
  }

  const imageUrl = getValidImageUrl(rawImageUrl)

  // Get the number of ratings (placeholder for now)
  const ratingCount = product.reviews?.length || Math.floor(Math.random() * 20) + 1

  // Handle product click to navigate to detail page
  const handleProductClick = () => {
    // Navigate to product detail page - using the correct route
    router.push(`/products/${product.id}`)
  }

  // Handle add to cart functionality
  const handleAddToCart = async (e) => {
    e.preventDefault() // Prevent default behavior
    e.stopPropagation() // Prevent event bubbling to avoid navigation

    if (!product.variants || product.variants.length === 0) {
      alert("This product has no available variants")
      return
    }

    // If multiple variants, redirect to product detail page to select
    if (product.variants.length > 1) {
      router.push(`/products/${product.id}`)
      return
    }

    // If only one variant, add it directly to cart
    const variant = product.variants[0]
    if (variant.stock <= 0) {
      alert("This item is out of stock")
      return
    }

    setIsAddingToCart(true)
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id || 0,
          quantity: 1,
          price: variant.price,
          variant: variant.value,
          productName: product.name,
          productImage: imageUrl,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Show success message
        alert("Product added to cart successfully!")
      } else {
        throw new Error(data.error || "Failed to add to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("Failed to add to cart. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Handle wishlist functionality
  const handleWishlistToggle = async (e) => {
    e.preventDefault() // Prevent default behavior
    e.stopPropagation() // Prevent event bubbling to avoid navigation

    setIsAddingToWishlist(true)
    try {
      const endpoint = isInWishlist ? "/api/wishlist/remove" : "/api/wishlist/add"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsInWishlist(!isInWishlist)
        const message = isInWishlist ? "Removed from wishlist" : "Added to wishlist"
        alert(message)
      } else {
        throw new Error(data.error || "Failed to update wishlist")
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
      alert("Failed to update wishlist. Please try again.")
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  return (
    <div className="bg-white rounded overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Product Image with click handler */}
      <div className="relative h-64 w-full bg-gray-100 cursor-pointer" onClick={handleProductClick}>
        {imageUrl && !hasImageError ? (
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain p-4 hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
            unoptimized={!imageUrl.startsWith("http")}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          </div>
        )}

        {/* Wishlist button - positioned inside the image container */}
        <button
          className={`absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
            isInWishlist ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:text-red-500 hover:bg-red-50"
          }`}
          onClick={handleWishlistToggle}
          disabled={isAddingToWishlist}
        >
          <Heart size={16} className={`transition-all duration-200 ${isInWishlist ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-3">
        {/* Product Name with click handler */}
        <h3
          className="text-base font-medium text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors duration-200"
          onClick={handleProductClick}
        >
          {product.name}
        </h3>

        {/* Star Ratings */}
        <div className="flex items-center mb-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">{`| ${ratingCount} Rating${
              ratingCount !== 1 ? "s" : ""
            }`}</span>
          </div>
        </div>

        {/* Product Description */}
        <p className="text-xs text-gray-600 mb-2 line-clamp-2" onClick={handleProductClick}>
          {product.description || "High quality car care product"}
        </p>

        <hr className="border-gray-200 mb-2" />

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-base font-bold text-gray-800">₹{minPrice}</p>
          {product.variants && product.variants.length > 0 && (
            <span className="text-xs text-gray-500">
              {product.variants.some((v) => v.stock > 0) ? "In Stock" : "Out of Stock"}
            </span>
          )}
        </div>

        {/* Add to Cart Button - with onClick that doesn't propagate */}
        <button
          className="w-full bg-blue-600 border border-blue-600 text-white py-1.5 px-4 rounded text-sm hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToCart}
          disabled={isAddingToCart || !product.variants?.some((v) => v.stock > 0)}
        >
          <ShoppingCart size={14} />
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
