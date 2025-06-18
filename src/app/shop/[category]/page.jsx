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
  const router = useRouter()
  const { category: categoryParam } = useParams()
  const [currentCategory, setCurrentCategory] = useState(categoryParam)
  const searchParams = useSearchParams()

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

    const newUrl = `/shop/${currentCategory}${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(newUrl, { scroll: false })
  }, [
    currentCategory,
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
    setLoading(true);
    setError(null);

    try {
      console.log("Starting fetchProducts for category:", currentCategory);
      console.log("Current filters:", {
        size: selectedSize,
        color: selectedColor,
        gsm: selectedGsm,
        quantity: selectedQuantity,
        minPrice: minPrice,
        maxPrice: maxPrice,
        rating: selectedRating,
        inStock: inStockOnly
      });

      let products = [];

      if (currentCategory === "kits-combos") {
        console.log("Fetching kits and combos...");
        try {
          const kitsAndCombos = await KitsCombosService.getKitsAndCombos();
          console.log("Raw Kits and Combos data:", kitsAndCombos);

          if (Array.isArray(kitsAndCombos)) {
            products = kitsAndCombos;
          } else {
            console.error("Kits and combos data is not an array:", kitsAndCombos);
            throw new Error("Invalid kits and combos data format");
          }
        } catch (error) {
          console.error("Error fetching kits and combos:", error);
          throw new Error(`Failed to fetch kits and combos: ${error.message}`);
        }
      } else {
        console.log("Fetching products for category:", currentCategory);
        try {
          // Prepare filter parameters
          const filterParams = {
            limit: 1000,
            sort,
            filters: {
              size: selectedSize.length > 0 ? selectedSize : undefined,
              color: selectedColor.length > 0 ? selectedColor : undefined,
              gsm: selectedGsm.length > 0 ? selectedGsm : undefined,
              quantity: selectedQuantity.length > 0 ? selectedQuantity : undefined,
              minPrice: minPrice ? parseFloat(minPrice) : undefined,
              maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
              rating: selectedRating > 0 ? selectedRating : undefined,
              inStock: inStockOnly ? true : undefined
            }
          };

          // Remove undefined filters
          Object.keys(filterParams.filters).forEach(key => {
            if (filterParams.filters[key] === undefined) {
              delete filterParams.filters[key];
            }
          });

          console.log("Filter parameters:", filterParams);
          const response = await ProductService.getProductsByCategory(currentCategory, filterParams);
          console.log("Raw API Response:", response);

          if (response?.success && Array.isArray(response.products)) {
            products = response.products;
          } else if (Array.isArray(response)) {
            products = response;
          } else if (response?.data) {
            products = Array.isArray(response.data) ? response.data : [];
          } else {
            console.error("Invalid API response format:", response);
            throw new Error("Invalid API response format");
          }
        } catch (error) {
          console.error("Error fetching products by category:", error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }
      }

      console.log("Products before transformation:", products);

      if (!Array.isArray(products) || products.length === 0) {
        console.log("No products found or invalid products array");
        setProducts([]);
        setTotalCount(0);
        setError("No products available in this category. Please try another category or check back later.");
        return;
      }

      // Transform all products using ProductService.formatProductForDisplay
      const transformedProducts = products
        .map(product => {
          try {
            console.log("Transforming product:", product);
            const transformed = ProductService.formatProductForDisplay(product);
            console.log("Transformed result:", transformed);
            return transformed;
          } catch (error) {
            console.error("Error transforming product:", error, product);
            return null;
          }
        })
        .filter(product => {
          if (!product) {
            console.log("Filtered out null product");
            return false;
          }

          // Special handling for kits and combos
          if (currentCategory === "kits-combos") {
            // For kits and combos, only check basic validity
            const isValid = product.price > 0 && product.name && product.description;
            if (!isValid) {
              console.log(`Kit/Combo "${product.name}" filtered out - missing required fields`);
            }
            return isValid;
          }

          // Regular product filtering
          const matchesSize = selectedSize.length === 0 ||
            (product.variants && product.variants.some(v => selectedSize.includes(v.size)));

          const matchesColor = selectedColor.length === 0 ||
            (product.variants && product.variants.some(v => selectedColor.includes(v.color)));

          const matchesGsm = selectedGsm.length === 0 ||
            (product.variants && product.variants.some(v => selectedGsm.includes(v.gsm)));

          const matchesQuantity = selectedQuantity.length === 0 ||
            (product.variants && product.variants.some(v => selectedQuantity.includes(v.quantity)));

          const matchesPrice = (!minPrice || product.minPrice >= parseFloat(minPrice)) &&
            (!maxPrice || product.maxPrice <= parseFloat(maxPrice));

          const matchesRating = !selectedRating || product.rating >= selectedRating;

          const matchesStock = !inStockOnly || product.totalStock > 0;

          const hasValidVariants = Array.isArray(product.variants) &&
            product.variants.length > 0 &&
            product.variants.some(variant => variant.price > 0);

          const hasValidPrice = product.minPrice > 0 || product.maxPrice > 0;

          // Calculate matches
          const matches = matchesSize && matchesColor && matchesGsm && matchesQuantity &&
            matchesPrice && matchesRating && matchesStock && hasValidVariants && hasValidPrice;

          // Log detailed filter information
          if (!matches) {
            console.log(`Product "${product.name}" filtered out because:`, {
              size: !matchesSize ? `No variants match selected sizes: ${selectedSize.join(', ')}` : 'matches',
              color: !matchesColor ? `No variants match selected colors: ${selectedColor.join(', ')}` : 'matches',
              gsm: !matchesGsm ? `No variants match selected GSM: ${selectedGsm.join(', ')}` : 'matches',
              quantity: !matchesQuantity ? `No variants match selected quantities: ${selectedQuantity.join(', ')}` : 'matches',
              price: !matchesPrice ? `Price ${product.minPrice}-${product.maxPrice} outside range ${minPrice}-${maxPrice}` : 'matches',
              rating: !matchesRating ? `Rating ${product.rating} below selected ${selectedRating}` : 'matches',
              stock: !matchesStock ? 'No stock available' : 'matches',
              variants: !hasValidVariants ? 'No valid variants' : 'has valid variants',
              price: !hasValidPrice ? 'No valid price' : 'has valid price'
            });
          }

          return matches;
        });

      console.log("Final transformed product data:", transformedProducts);

      if (transformedProducts.length > 0) {
        setProducts(transformedProducts);
        setTotalCount(transformedProducts.length);
      } else {
        console.log("No valid products found after transformation and filtering");
        setProducts([]);
        setTotalCount(0);
        setError("No products match your selected filters. Please try adjusting your filters.");
      }
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      setError(err.message || "Failed to load products. Please try again later.");
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, sort, selectedSize, selectedColor, selectedGsm, selectedQuantity, minPrice, maxPrice, selectedRating, inStockOnly]);

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
  }, [currentCategory])

  // Update the useEffect to handle initial load and category changes
  useEffect(() => {
    console.log("Initial category load:", currentCategory);
    if (currentCategory) {
      fetchProducts();
    }
  }, [currentCategory]);

  // Handler functions
  const handleSortChange = (newSort) => {
    console.log("Sort changed to:", newSort)
    setSort(newSort)
  }

  const handleCategoryChange = async (newCategory) => {
    console.log("Handling category change:", {
      from: currentCategory,
      to: newCategory
    });

    // Clear all filters when changing category
    setSelectedSize([]);
    setSelectedColor([]);
    setSelectedGsm([]);
    setSelectedQuantity([]);
    setMinPrice("0");
    setMaxPrice("1000");
    setPriceRange([0, 1000]);
    setSelectedRating(0);
    setInStockOnly(false);
    setSort("popularity");

    // Update URL with the new category
    const normalizedCategory = newCategory.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
      // Update the current category state
      setCurrentCategory(normalizedCategory);

      // Update the URL
      await router.push(`/shop/${normalizedCategory}`, undefined, {
        shallow: true
      });
    } catch (error) {
      console.error("Error changing category:", error);
    }
  };

  const handleClearFilters = useCallback(() => {
    console.log("Clearing all filters");
    setSelectedSize([]);
    setSelectedColor([]);
    setSelectedGsm([]);
    setSelectedQuantity([]);
    setSelectedRating(0);
    setInStockOnly(false);
    setPriceRange([0, 1000]);
    setMinPrice("");
    setMaxPrice("");
    fetchProducts();
  }, [fetchProducts]);

  const handleApplyFilters = useCallback(() => {
    console.log("Applying filters:", {
      size: selectedSize,
      color: selectedColor,
      gsm: selectedGsm,
      quantity: selectedQuantity,
      minPrice,
      maxPrice,
      rating: selectedRating,
      inStock: inStockOnly
    });
    setShowMobileFilter(false);
    fetchProducts();
  }, [selectedSize, selectedColor, selectedGsm, selectedQuantity, minPrice, maxPrice, selectedRating, inStockOnly, fetchProducts]);

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
      categoryNames[currentCategory] || currentCategory?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Products"
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
            <p className="text-sm text-gray-600">
              {loading ? "Loading products..." : error ? "Error loading products" : `${totalCount} products found`}
            </p>

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
                category={currentCategory}
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
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white p-4 rounded-lg shadow">
                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
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
                  category={currentCategory}
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
                  isMobile={true}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
