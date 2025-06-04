"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ProductService } from "@/lib/service/productService"
import { KitsCombosService } from "@/lib/service/kitsCombosService"
import FilterSidebar from "@/components/shop/FilterSidebar"
import ProductGrid from "@/components/shop/ProductGrid"
import MobileFilterModal from "@/components/shop/MobileFilterModal"
import { Filter, ArrowUpDown } from "lucide-react"

export default function ShopPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = params.category || "all"

  // State for products and loading
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([]) // Store all products for filter options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  // Mobile states
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [showMobileSort, setShowMobileSort] = useState(false)

  // State for search and sort
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [sort, setSort] = useState(searchParams.get("sort") || "popularity")

  // State for filters - Fixed initialization
  const [selectedSize, setSelectedSize] = useState(() => {
    const sizeParam = searchParams.get("size")
    return sizeParam ? sizeParam.split(",").filter(Boolean) : []
  })
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [priceRange, setPriceRange] = useState([
    Number.parseInt(searchParams.get("minPrice")) || 0,
    Number.parseInt(searchParams.get("maxPrice")) || 1000,
  ])
  const [selectedRating, setSelectedRating] = useState(Number.parseInt(searchParams.get("rating")) || 0)
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true")
  const [selectedColor, setSelectedColor] = useState(() => {
    const colorParam = searchParams.get("color")
    return colorParam ? colorParam.split(",").filter(Boolean) : []
  })
  const [selectedGsm, setSelectedGsm] = useState(() => {
    const gsmParam = searchParams.get("gsm")
    return gsmParam ? gsmParam.split(",").filter(Boolean) : []
  })
  const [selectedQuantity, setSelectedQuantity] = useState(() => {
    const quantityParam = searchParams.get("quantity")
    return quantityParam ? quantityParam.split(",").filter(Boolean) : []
  })

  // Debounced search to avoid too frequent API calls
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Check if mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Changed to 1024px as per requirements
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Update URL with current filters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

    if (debouncedSearch) params.set("search", debouncedSearch)
    if (sort !== "popularity") params.set("sort", sort)
    if (selectedSize.length > 0) params.set("size", selectedSize.join(","))
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (selectedRating > 0) params.set("rating", selectedRating.toString())
    if (inStockOnly) params.set("inStock", "true")
    if (selectedColor.length > 0) params.set("color", selectedColor.join(","))
    if (selectedGsm.length > 0) params.set("gsm", selectedGsm.join(","))
    if (selectedQuantity.length > 0) params.set("quantity", selectedQuantity.join(","))

    const newUrl = `/shop/${category}${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(newUrl, { scroll: false })
  }, [
    category,
    debouncedSearch,
    sort,
    selectedSize,
    minPrice,
    maxPrice,
    selectedRating,
    inStockOnly,
    selectedColor,
    selectedGsm,
    selectedQuantity,
    router,
  ])

  // Fetch all products once for filter options
  const fetchAllProducts = useCallback(async () => {
    try {
      console.log("Fetching all products for filter options...")

      // Fetch all products from different sources
      const [regularProducts, kitsAndCombos] = await Promise.all([
        ProductService.getProducts({ limit: 1000 }), // Get all regular products
        KitsCombosService.getKits()
          .then((kitsResponse) => {
            const kits = Array.isArray(kitsResponse.kits) ? kitsResponse.kits : []
            return KitsCombosService.getCombos().then((combosResponse) => {
              const combos = Array.isArray(combosResponse.combos) ? combosResponse.combos : []
              return [...kits, ...combos]
            })
          })
          .catch(() => []), // Fallback to empty array if kits/combos fail
      ])

      const allProductsData = [...(regularProducts.products || []), ...kitsAndCombos]

      const formattedProducts = allProductsData
        .map((product) => ProductService.formatProductForDisplay(product))
        .filter(Boolean)

      setAllProducts(formattedProducts)
      console.log("All products fetched for filters:", formattedProducts.length)
    } catch (error) {
      console.error("Error fetching all products for filters:", error)
      setAllProducts([])
    }
  }, [])

  // Fetch products function - Updated to handle new API response structure
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let response
      let productData = []
      let responseCount = 0

      // Handle different category cases with proper service calls
      if (category === "kits-combos") {
        // Use KitsCombosService for kits and combos
        console.log("Fetching kits and combos...")
        const [kitsResponse, combosResponse] = await Promise.all([
          KitsCombosService.getKits().catch(() => ({ kits: [] })),
          KitsCombosService.getCombos().catch(() => ({ combos: [] })),
        ])

        const kits = Array.isArray(kitsResponse.kits) ? kitsResponse.kits : []
        const combos = Array.isArray(combosResponse.combos) ? combosResponse.combos : []

        productData = [...kits, ...combos]
        responseCount = productData.length
      } else if (category === "all") {
        // Get all products including kits and combos
        const [regularProducts, kitsResponse, combosResponse] = await Promise.all([
          ProductService.getProducts({ limit: 50, sort }),
          KitsCombosService.getKits().catch(() => ({ kits: [] })),
          KitsCombosService.getCombos().catch(() => ({ combos: [] })),
        ])

        const kits = Array.isArray(kitsResponse.kits) ? kitsResponse.kits : []
        const combos = Array.isArray(combosResponse.combos) ? combosResponse.combos : []

        productData = [...(regularProducts.products || []), ...kits, ...combos]
        responseCount = productData.length
      } else {
        // Get products by category
        response = await ProductService.getProductsByCategory(category, { limit: 50, sort })

        if (response?.success && Array.isArray(response.products)) {
          productData = response.products
          responseCount = response.total || response.products.length
        } else if (Array.isArray(response)) {
          productData = response
          responseCount = response.length
        } else if (response?.data) {
          productData = Array.isArray(response.data) ? response.data : []
          responseCount = response.total || response.count || productData.length
        }
      }

      console.log("Raw product data:", productData.length)

      // Apply client-side filtering for variant-specific filters
      const filteredProducts = productData
        .map((product) => ProductService.formatProductForDisplay(product))
        .filter((product) => {
          // Skip if product is null
          if (!product) return false

          // Search filter
          if (debouncedSearch) {
            const searchTerm = debouncedSearch.toLowerCase()
            const nameMatch = product.name?.toLowerCase().includes(searchTerm)
            const descMatch = product.description?.toLowerCase().includes(searchTerm)
            if (!nameMatch && !descMatch) return false
          }

          // Rating filter
          if (selectedRating > 0) {
            const productRating = product.averageRating || 0
            if (productRating < selectedRating) return false
          }

          // Filter by variants
          if (product.variants && product.variants.length > 0) {
            // Check if any variant matches all selected filters
            const hasMatchingVariant = product.variants.some((variant) => {
              // Size filter
              const sizeMatch =
                selectedSize.length === 0 ||
                selectedSize.some((size) => variant.size === size || variant.size_cm === size)

              // Color filter
              const colorMatch = selectedColor.length === 0 || selectedColor.includes(variant.color)

              // GSM filter (for microfiber)
              const gsmMatch = selectedGsm.length === 0 || selectedGsm.includes(variant.gsm)

              // Quantity filter (for non-microfiber)
              const quantityMatch = selectedQuantity.length === 0 || selectedQuantity.includes(variant.quantity)

              // Stock filter
              const stockMatch = !inStockOnly || variant.stock > 0

              // Price range filter
              const priceMatch =
                (!minPrice || variant.price >= Number.parseFloat(minPrice)) &&
                (!maxPrice || variant.price <= Number.parseFloat(maxPrice))

              return sizeMatch && colorMatch && gsmMatch && quantityMatch && stockMatch && priceMatch
            })

            return hasMatchingVariant
          }

          // If no variants, apply basic filters
          const stockMatch = !inStockOnly || (product.totalStock && product.totalStock > 0)
          const priceMatch =
            (!minPrice || product.minPrice >= Number.parseFloat(minPrice)) &&
            (!maxPrice || product.maxPrice <= Number.parseFloat(maxPrice))

          return stockMatch && priceMatch
        })

      setProducts(filteredProducts)
      setTotalCount(filteredProducts.length)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to load products")
      setProducts([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [
    category,
    debouncedSearch,
    sort,
    selectedSize,
    minPrice,
    maxPrice,
    selectedRating,
    inStockOnly,
    selectedColor,
    selectedGsm,
    selectedQuantity,
  ])

  // Fetch all products for filter options on mount
  useEffect(() => {
    fetchAllProducts()
  }, [fetchAllProducts])

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Update URL when filters change (separate from fetch to avoid loops)
  useEffect(() => {
    updateUrlParams()
  }, [updateUrlParams])

  // Clear filters when category changes
  useEffect(() => {
    // Reset all filters when category changes
    setSelectedSize([])
    setSelectedColor([])
    setSelectedGsm([])
    setSelectedQuantity([])
    setSelectedRating(0)
    setInStockOnly(false)
    setPriceRange([0, 1000])
    setMinPrice("")
    setMaxPrice("")
    setSearch("")
  }, [category])

  // Handler functions
  const handleSortChange = (newSort) => {
    console.log("Sort changed to:", newSort)
    setSort(newSort)
    setShowMobileSort(false)
  }

  const handleCategoryChange = (newCategory) => {
    console.log("Category changed to:", newCategory)
    router.push(`/shop/${newCategory}`)
  }

  const handleClearFilters = () => {
    console.log("Clearing all filters")
    setSelectedSize([])
    setSelectedColor([])
    setSelectedGsm([])
    setSelectedQuantity([])
    setSelectedRating(0)
    setInStockOnly(false)
    setPriceRange([0, 1000])
    setMinPrice("")
    setMaxPrice("")
    setSearch("")
  }

  const handleApplyFilters = () => {
    console.log("Applying filters manually")
    setShowMobileFilter(false)
    fetchProducts()
  }

  // Helper functions
  const getCategoryDisplayName = () => {
    const categoryNames = {
      all: "All Products",
      "car-interior": "Car Interior",
      "car-exterior": "Car Exterior",
      "microfiber-cloth": "Microfiber Cloth",
      microfiber: "Microfiber Cloth",
      "kits-combos": "Kits & Combos",
      accessories: "Accessories",
    }

    return (
      categoryNames[category] || category?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Products"
    )
  }

  const hasActiveFilters = () => {
    return (
      selectedSize.length > 0 ||
      selectedColor.length > 0 ||
      selectedGsm.length > 0 ||
      selectedQuantity.length > 0 ||
      selectedRating > 0 ||
      inStockOnly ||
      priceRange[0] > 0 ||
      priceRange[1] < 1000 ||
      search.trim() !== ""
    )
  }

  const sortOptions = [
    { value: "popularity", label: "Popularity" },
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Customer Rating" },
    { value: "name", label: "Name (A-Z)" },
  ]

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-[1300px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{getCategoryDisplayName()}</h1>
          <p className="text-sm text-gray-600 mb-4">{loading ? "Loading..." : `${totalCount} products found`}</p>

          {/* Search and Sort Controls - Desktop Only */}
          {!isMobile && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div className="flex-1 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Search for Mobile/Tablet */}
          {isMobile && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <FilterSidebar
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                category={category}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedGsm={selectedGsm}
                setSelectedGsm={setSelectedGsm}
                selectedQuantity={selectedQuantity}
                setSelectedQuantity={setSelectedQuantity}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                onCategoryChange={handleCategoryChange}
                products={allProducts}
              />
            </div>
          )}

          {/* Products Grid Container */}
          <div className={`flex-1 ${isMobile ? "pb-20" : ""}`}>
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg font-medium mb-2">Error Loading Products</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <ProductGrid
                products={products}
                loading={loading}
                error={null}
                hasActiveFilters={hasActiveFilters()}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>

        {/* Mobile Bottom Sticky Filter/Sort Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
            <div className="flex gap-3 max-w-[1240px] mx-auto">
              {/* Sort Button */}
              <button
                onClick={() => setShowMobileSort(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowUpDown size={16} />
                Sort
              </button>

              {/* Filter Button */}
              <button
                onClick={() => setShowMobileFilter(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-800 transition-colors relative"
              >
                <Filter size={16} />
                Filter
                {hasActiveFilters() && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[
                      selectedSize.length > 0,
                      selectedColor.length > 0,
                      selectedGsm.length > 0,
                      selectedQuantity.length > 0,
                      selectedRating > 0,
                      inStockOnly,
                      priceRange[0] > 0 || priceRange[1] < 1000,
                      search.trim() !== ""
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sort Modal */}
        {showMobileSort && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div className="bg-white w-full rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sort By</h3>
                <button
                  onClick={() => setShowMobileSort(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                      sort === option.value
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <MobileFilterModal
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            category={category}
            selectedRating={selectedRating}
            setSelectedRating={setSelectedRating}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedGsm={selectedGsm}
            setSelectedGsm={setSelectedGsm}
            selectedQuantity={selectedQuantity}
            setSelectedQuantity={setSelectedQuantity}
            onClose={() => setShowMobileFilter(false)}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
            onCategoryChange={handleCategoryChange}
            products={allProducts}
            hasActiveFilters={hasActiveFilters()}
          />
        )}
      </div>
    </div>
  )
}
