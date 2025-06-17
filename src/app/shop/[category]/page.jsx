"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ProductService } from "@/lib/service/productService"
import { KitsCombosService } from "@/lib/service/kitsCombosService"
import { CategoryService } from "@/lib/service/microdataService"
import FilterSidebar from "@/components/shop/FilterSidebar"
import ProductGrid from "@/components/shop/ProductGrid"
import { Filter, ArrowUpDown, X } from "lucide-react"

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

  // State for sort
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

  // Check if mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Changed to 1024px as per requirements
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close mobile filter when screen size changes
  useEffect(() => {
    if (!isMobile && showMobileFilter) {
      setShowMobileFilter(false)
    }
  }, [isMobile, showMobileFilter])

  // Update URL with current filters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

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

        const kits = Array.isArray(kitsResponse.kits) ? kitsResponse.kits.map(kit => ({
          ...kit,
          image_url: kit.image_url || `/images/products/kits/${kit.id}.jpg`,
          main_image_url: kit.main_image_url || `/images/products/kits/${kit.id}.jpg`
        })) : []

        const combos = Array.isArray(combosResponse.combos) ? combosResponse.combos.map(combo => ({
          ...combo,
          image_url: combo.image_url || `/images/products/combos/${combo.id}.jpg`,
          main_image_url: combo.main_image_url || `/images/products/combos/${combo.id}.jpg`
        })) : []

        productData = [...kits, ...combos]
        responseCount = productData.length
      } else if (category === "all") {
        // Get all products including kits and combos
        const [regularProducts, kitsResponse, combosResponse] = await Promise.all([
          ProductService.getProducts({ limit: 50, sort }),
          KitsCombosService.getKits().catch(() => ({ kits: [] })),
          KitsCombosService.getCombos().catch(() => ({ combos: [] })),
        ])

        const kits = Array.isArray(kitsResponse.kits) ? kitsResponse.kits.map(kit => ({
          ...kit,
          image_url: kit.image_url || `/images/products/kits/${kit.id}.jpg`,
          main_image_url: kit.main_image_url || `/images/products/kits/${kit.id}.jpg`
        })) : []

        const combos = Array.isArray(combosResponse.combos) ? combosResponse.combos.map(combo => ({
          ...combo,
          image_url: combo.image_url || `/images/products/combos/${combo.id}.jpg`,
          main_image_url: combo.main_image_url || `/images/products/combos/${combo.id}.jpg`
        })) : []

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
  }, [category])

  // Handler functions
  const handleSortChange = (newSort) => {
    console.log("Sort changed to:", newSort)
    setSort(newSort)
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
      priceRange[1] < 1000
    )
  }

  const getActiveFiltersCount = () => {
    return [
      selectedSize.length > 0,
      selectedColor.length > 0,
      selectedGsm.length > 0,
      selectedQuantity.length > 0,
      selectedRating > 0,
      inStockOnly,
      priceRange[0] > 0 || priceRange[1] < 1000
    ].filter(Boolean).length
  }

  const sortOptions = [
    { value: "popularity", label: "Popularity" },
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Customer Rating" },
    { value: "name", label: "Name (A-Z)" },
  ]

  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await CategoryService.getCategories()
        if (response.success) {
          setCategories(response.data || [])
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-[1300px]">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">{loading ? "Loading..." : `${totalCount} products found`}</p>

            {/* Mobile Filter/Sort Buttons */}
            {isMobile && (
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  {/* <label className="text-sm text-gray-700">Sort:</label> */}
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    console.log('Filter button clicked, current state:', showMobileFilter);
                    setShowMobileFilter(true);
                  }}
                  className="flex items-center gap-2 bg-black text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-800 transition-colors relative"
                >
                  <Filter size={16} />
                  Filter
                  {hasActiveFilters() && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Desktop Sort Controls */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
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
          <div className="flex-1">
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

        {/* Mobile Side Filter Panel */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black transition-opacity duration-300 z-[9998] ${
                showMobileFilter ? 'opacity-50' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setShowMobileFilter(false)}
            />

            {/* Side Filter Panel */}
            <div className={`
              fixed top-0 left-0 h-full w-96 max-w-[90vw] bg-white z-[9999]
              transform transition-transform duration-300 ease-in-out
              ${showMobileFilter ? 'translate-x-0' : '-translate-x-full'}
              flex flex-col
            `}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white flex-shrink-0">
                <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close filters"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Filter Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5">
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
                  onApplyFilters={() => {
                    handleApplyFilters();
                  }}
                  onCategoryChange={handleCategoryChange}
                  products={allProducts}
                  isMobile={true}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
