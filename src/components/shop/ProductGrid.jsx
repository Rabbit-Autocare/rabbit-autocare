"use client"

import ProductCard from "./ProductCard"

const ProductGrid = ({ products, loading, error, hasActiveFilters, onClearFilters }) => {
  // Loading state
  if (loading) {
    return (
      <div className="product-grid">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded border animate-pulse"
            style={{ width: "300px", height: "480px" }}
          >
            <div className="w-full h-48 bg-gray-200 rounded-t"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
            </div>
          </div>
        ))}
        <style jsx>{`
          .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, 300px);
            gap: 1.5rem;
            justify-content: center;
            justify-items: center;
          }
          @media (min-width: 1024px) {
            .product-grid {
              justify-content: flex-start;
              justify-items: flex-start;
            }
          }
        `}</style>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-medium mb-2">Error Loading Products</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // No products found
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg font-medium mb-2">
          {hasActiveFilters ? "No Products Match Your Filters" : "No Products Found"}
        </div>
        <p className="text-gray-600 mb-4">
          {hasActiveFilters
            ? "Try adjusting your filters to see more results"
            : "Check back later for new products"
          }
        </p>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    )
  }

  // Validate products array and filter out invalid entries
  const validProducts = products.filter(product => {
    if (!product) {
      console.warn("Invalid product found (null/undefined):", product)
      return false
    }

    if (!product.id && !product._id) {
      console.warn("Product missing ID:", product)
      return false
    }

    if (!product.name) {
      console.warn("Product missing name:", product)
      return false
    }

    return true
  })

  // Log for debugging
  console.log("ProductGrid rendering:", {
    totalProducts: products.length,
    validProducts: validProducts.length,
    sampleProduct: validProducts[0]
  })

  return (
    <div className="w-full">
      {/* Results summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {validProducts.length} product{validProducts.length !== 1 ? 's' : ''}
        {hasActiveFilters && " (filtered)"}
      </div>

      {/* Products grid */}
      <div className="product-grid">
        {validProducts.map((product, index) => {
          // Use product.id or product._id as key, fallback to index
          const productKey = product.id || product._id || `product-${index}`

          return (
            <ProductCard
              key={productKey}
              product={product}
              index={index}
            />
          )
        })}
      </div>

      {/* Show message if some products were filtered out */}
      {products.length > validProducts.length && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Note: {products.length - validProducts.length} product(s) could not be displayed due to missing data.
        </div>
      )}

      <style jsx>{`
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 300px);
          gap: 1.5rem;
          justify-content: center;
          justify-items: center;
        }
        @media (min-width: 1024px) {
          .product-grid {
            justify-content: flex-start;
            justify-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default ProductGrid
