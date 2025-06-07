"use client"

import { useState, useEffect } from "react"
import { ProductService } from "@/lib/service/productService"
import FeaturedProductCard from "@/components/ui/FeaturedProductCard"
import ProductTabs from "@/components/shop/ProductTabs"
import RelatedProducts from "@/components/shop/RelatedProducts"
import { Loader2 } from "lucide-react"

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError(null)

        const productId = params.id
        console.log("Fetching product with ID:", productId)

        // Use ProductService to fetch the product
        const productData = await ProductService.getProductById(productId)

        if (productData) {
          // Format product for display
          const formattedProduct = ProductService.formatProductForDisplay(productData)
          setProduct(formattedProduct)
        } else {
          throw new Error("Product not found")
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError(err.message || "Could not load the product. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  // Handle add to cart functionality
 // FeaturedProductCard.jsx
const handleAddToCart = async () => {
  try {
    await addToCart(product.id, selectedVariantIndex, 1);
    // Show success message
    console.log('Item added to cart successfully!');
  } catch (error) {
    console.error('Error adding to cart:', error);
    // Handle error - maybe redirect to login if not authenticated
    if (error.message.includes('not authenticated')) {
      router.push('/login');
    }
  }
};

  const handleBuyNow = async (cartItem) => {
    try {
      // Add to cart first
      const success = await handleAddToCart(cartItem)

      if (success) {
        // Redirect to checkout
        window.location.href = "/checkout"
      }
    } catch (error) {
      console.error("Error in buy now:", error)
    }
  }

  const handleAddToWishlist = async (product) => {
    try {
      console.log("Adding to wishlist:", product)

      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id || product.product_code,
          productName: product.name,
          productImage: product.main_image_url || product.images?.[0],
          price: product.price || product.mrp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to wishlist")
      }

      console.log("Successfully added to wishlist:", data)
      return true
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      return false
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600 mb-2">{error || "Product not found"}</p>
            <p className="text-sm text-red-500 mb-4">Product ID: {params.id || "Unknown"}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-gray-700">
          Home
        </a>
        <span>/</span>
        <a href="/shop" className="hover:text-gray-700">
          Shop
        </a>
        <span>/</span>
        {product.category && (
          <>
            <a href={`/shop/${product.category.slug}`} className="hover:text-gray-700">
              {product.category.name}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700">{product.name}</span>
      </nav>

      {/* Product Detail using FeaturedProductCard */}
      <div className="space-y-12">
        <FeaturedProductCard
          product={product}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onAddToWishlist={handleAddToWishlist}
        />

        {/* Product tabs */}
        <ProductTabs product={product} reviews={product.reviews} />

        {/* Related products */}
        <RelatedProducts
          categoryName={product.category?.name || product.category_name}
          currentProductId={product.product_code}
        />
      </div>
    </div>
  )
}
