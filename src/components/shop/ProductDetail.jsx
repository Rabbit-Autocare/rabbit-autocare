"use client"

import { useState } from "react"
import FeaturedProductCard from "@/components/ui/FeaturedProductCard"
import KitComboCard from "@/components/ui/KitComboCard"
import ProductTabs from "@/components/shop/ProductTabs"
import RelatedProducts from "@/components/shop/RelatedProducts"

export default function ProductDetail({ product }) {
  const [addedToCart, setAddedToCart] = useState(false)

  // Check if the product is a kit or combo
  const isKitOrCombo = product?.category_name?.toLowerCase().includes("kits") ||
                      product?.category_name?.toLowerCase().includes("combos")

  // This handleAddToCart logic is removed as FeaturedProductCard now manages its own cart actions.
  // It will be removed entirely, or moved to a more appropriate context if needed elsewhere.

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Success notification */}
      {addedToCart && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-md z-50 transition-all duration-300">
          Product added to cart successfully!
        </div>
      )}

      {/* Product main section */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full">
          {isKitOrCombo ? (
            <KitComboCard product={product} />
          ) : (
            <FeaturedProductCard product={product} />
          )}
        </div>
      </div>

      {/* Product tabs */}
      <ProductTabs product={product} reviews={product.reviews} />

      {/* Related products */}
      <RelatedProducts
        categoryName={product.category?.name || product.category_name}
        currentProductId={product.product_code}
        includedProducts={isKitOrCombo ? (product.kit_products || product.combo_products) : undefined}
      />
    </div>
  )
}
