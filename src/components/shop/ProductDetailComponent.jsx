"use client"

import { useState } from "react"
import ProductImageGallery from "./ProductImageGallery"
import FeaturedProductCard from "@/components/ui/FeaturedProductCard" // Changed from ProductInfo
import ProductTabs from "./ProductTabs"
import RelatedProducts from "./RelatedProducts"

export default function ProductDetail({ product, onAddToCart }) {
  const [addedToCart, setAddedToCart] = useState(false)

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

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <div className="space-y-12">
      {/* Success notification */}
      {addedToCart && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-md z-50 transition-all duration-300">
          Product added to cart successfully!
        </div>
      )}

      {/* Product main section */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* <ProductImageGallery images={product.images || [product.main_image_url]} alt={product.name} /> */}

        {/* Replace ProductInfo with FeaturedProductCard */}
        <div className="w-full md:w-1/2">
          <FeaturedProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={(item) => {
              handleAddToCart(item)
              // Redirect to checkout
              window.location.href = "/checkout"
            }}
            onAddToWishlist={(product) => {
              console.log("Added to wishlist:", product)
              return Promise.resolve(true)
            }}
          />
        </div>
      </div>

      {/* Product tabs */}
      <ProductTabs product={product} reviews={product.reviews} />

      {/* Related products */}
      <RelatedProducts
        categoryName={product.category?.name || product.category_name}
        currentProductId={product.product_code}
      />
    </div>
  )
}
