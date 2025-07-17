"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ProductService } from "@/lib/service/productService"
import { KitsCombosService } from "@/lib/service/kitsCombosService"
import FilterSidebar from "@/components/shop/FilterSidebar"
import ProductGrid from "@/components/shop/ProductGrid"
import { Filter, ArrowUpDown, X } from "lucide-react"
import BannerCarousel from "@/components/shop/BannerCarousel"

export default function ShopPage({ initialCategories, initialError }) {
  const router = useRouter()
  const { category: categoryParam } = useParams()
  const [currentCategory, setCurrentCategory] = useState(categoryParam)
  const searchParams = useSearchParams()

  // State for products and loading
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(initialError)
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
    selectedGsm,
    selectedQuantity,
    router,
  ])

  // Fetch products function - Updated to handle new API response structure
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Starting fetchProducts for category:", currentCategory);
      console.log("Current filters:", {
        size: selectedSize,
        gsm: selectedGsm,
        quantity: selectedQuantity,
        minPrice: minPrice,
        maxPrice: maxPrice,
        rating: selectedRating,
        inStock: inStockOnly
      });

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )

      let products = [];

      if (currentCategory === "kits-combos") {
        console.log("Fetching kits and combos...");
        try {
          const kitsAndCombosPromise = KitsCombosService.getKitsAndCombos();
          const kitsAndCombos = await Promise.race([kitsAndCombosPromise, timeoutPromise]);
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

          const responsePromise = ProductService.getProductsByCategory(currentCategory, filterParams);
          const response = await Promise.race([responsePromise, timeoutPromise]);

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

      // Apply filters to products - Special handling for kits-combos
      let filteredProducts = products;

      if (currentCategory === "kits-combos") {
        // Special filtering for kits and combos
        console.log("Applying special filtering for kits and combos");
        console.log("Initial products count:", filteredProducts.length);
        console.log("Current filter values:", {
          minPrice,
          maxPrice,
          selectedRating,
          inStockOnly
        });

        // Auto-adjust price range to include all kits and combos
        if (filteredProducts.length > 0) {
          const prices = filteredProducts.map(product => parseFloat(product.price) || 0);
          const minProductPrice = Math.min(...prices);
          const maxProductPrice = Math.max(...prices);

          console.log(`Product price range: ${minProductPrice} - ${maxProductPrice}`);

          // Update price range if current range doesn't include all products
          if (minPrice && parseFloat(minPrice) > minProductPrice) {
            console.log(`Adjusting minPrice from ${minPrice} to ${minProductPrice}`);
            setMinPrice(minProductPrice.toString());
          }
          if (maxPrice && parseFloat(maxPrice) < maxProductPrice) {
            console.log(`Adjusting maxPrice from ${maxPrice} to ${maxProductPrice}`);
            setMaxPrice(maxProductPrice.toString());
          }

          // Update price range state if needed
          if (priceRange[0] > minProductPrice || priceRange[1] < maxProductPrice) {
            const newPriceRange = [
              Math.min(priceRange[0], minProductPrice),
              Math.max(priceRange[1], maxProductPrice)
            ];
            console.log(`Updating price range from [${priceRange[0]}, ${priceRange[1]}] to [${newPriceRange[0]}, ${newPriceRange[1]}]`);
            setPriceRange(newPriceRange);
          }
        }

        // Apply price filter for kits/combos
        if (minPrice || maxPrice) {
          const beforePriceFilter = filteredProducts.length;
          filteredProducts = filteredProducts.filter(product => {
            const price = parseFloat(product.price) || 0;
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            const passes = price >= min && price <= max;
            if (!passes) {
              console.log(`Price filter removed: ${product.name} (price: ${price}, range: ${min}-${max})`);
            }
            return passes;
          });
          console.log(`Price filter: ${beforePriceFilter} -> ${filteredProducts.length}`);
        }

        // Apply rating filter for kits/combos
        if (selectedRating > 0) {
          const beforeRatingFilter = filteredProducts.length;
          filteredProducts = filteredProducts.filter(product => {
            const ratings = generateDeterministicRatings(product);
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const passes = avg >= selectedRating;
            if (!passes) {
              console.log(`Rating filter removed: ${product.name} (rating: ${avg}, required: ${selectedRating})`);
            }
            return passes;
          });
          console.log(`Rating filter: ${beforeRatingFilter} -> ${filteredProducts.length}`);
        }

        // Apply in-stock filter for kits/combos
        if (inStockOnly) {
          const beforeStockFilter = filteredProducts.length;
          filteredProducts = filteredProducts.filter(product => {
            const stock = parseInt(product.stock_quantity) || 0;
            const passes = stock > 0;
            if (!passes) {
              console.log(`Stock filter removed: ${product.name} (stock: ${stock})`);
            }
            return passes;
          });
          console.log(`Stock filter: ${beforeStockFilter} -> ${filteredProducts.length}`);
        }

        // Apply sorting for kits/combos
        let sortedProducts = [...filteredProducts];
        switch (sort) {
          case "price-low-high":
            sortedProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
            break;
          case "price-high-low":
            sortedProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
            break;
          case "newest":
            sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
          case "rating":
            sortedProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
            break;
          case "name":
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          default: // popularity
            sortedProducts.sort((a, b) => (parseFloat(b.popularity_score) || 0) - (parseFloat(a.popularity_score) || 0));
        }

        setProducts(sortedProducts);
        setTotalCount(sortedProducts.length);
        console.log("Final filtered and sorted kits/combos:", sortedProducts.length);
        return;
      }

      // Regular product filtering (for non-kits-combos categories)
      // Apply size filter
      if (selectedSize.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const variants = product.variants || [];
          return variants.some(variant => selectedSize.includes(variant.size));
        });
      }

      // Apply GSM filter
      if (selectedGsm.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const variants = product.variants || [];
          // Check variant.gsm OR product name
          const matchesGsm = variants.some(variant => selectedGsm.includes(String(variant.gsm)))
            || selectedGsm.some(gsm => product.name && product.name.toLowerCase().includes(gsm.toLowerCase()));
          return matchesGsm;
        });
      }

      // Apply quantity filter
      if (selectedQuantity.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const variants = product.variants || [];
          return variants.some(variant => {
            // Build a normalized string for the variant's quantity and unit
            const variantQuantity = `${variant.quantity}${variant.unit ? ' ' + variant.unit : ''}`.replace(/\s+/g, '').toLowerCase();
            // Check against all selected quantities, normalized
            return selectedQuantity.some(q => q.replace(/\s+/g, '').toLowerCase() === variantQuantity);
          });
        });
      }

      // Apply price filter
      if (minPrice || maxPrice) {
        filteredProducts = filteredProducts.filter(product => {
          const variants = product.variants || [];
          return variants.some(variant => {
            const price = parseFloat(variant.price) || 0;
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            return price >= min && price <= max;
          });
        });
      }

      // Apply rating filter
      if (selectedRating > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const ratings = generateDeterministicRatings(product);
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          return avg >= selectedRating;
        });
      }

      // Apply in-stock filter
      if (inStockOnly) {
        filteredProducts = filteredProducts.filter(product => {
          const variants = product.variants || [];
          return variants.some(variant => (variant.stock || 0) > 0);
        });
      }

      // Apply sorting
      let sortedProducts = [...filteredProducts];
      switch (sort) {
        case "price-low-high":
          sortedProducts.sort((a, b) => {
            const aPrice = Math.min(...(a.variants || []).map(v => parseFloat(v.price) || 0));
            const bPrice = Math.min(...(b.variants || []).map(v => parseFloat(v.price) || 0));
            return aPrice - bPrice;
          });
          break;
        case "price-high-low":
          sortedProducts.sort((a, b) => {
            const aPrice = Math.max(...(a.variants || []).map(v => parseFloat(v.price) || 0));
            const bPrice = Math.max(...(b.variants || []).map(v => parseFloat(v.price) || 0));
            return bPrice - aPrice;
          });
          break;
        case "newest":
          sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case "rating":
          sortedProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
          break;
        case "name":
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default: // popularity
          sortedProducts.sort((a, b) => (parseFloat(b.popularity_score) || 0) - (parseFloat(a.popularity_score) || 0));
      }

      setProducts(sortedProducts);
      setTotalCount(sortedProducts.length);
      console.log("Final filtered and sorted products:", sortedProducts.length);

    } catch (err) {
      console.error("Error in fetchProducts:", err);
      setError(err.message || "Failed to load products. Please try again later.");
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, sort, selectedSize, selectedGsm, selectedQuantity, minPrice, maxPrice, selectedRating, inStockOnly]);

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
      gsm: selectedGsm,
      quantity: selectedQuantity,
      minPrice,
      maxPrice,
      rating: selectedRating,
      inStock: inStockOnly
    });
    setShowMobileFilter(false);
    fetchProducts();
  }, [selectedSize, selectedGsm, selectedQuantity, minPrice, maxPrice, selectedRating, inStockOnly, fetchProducts]);

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

  // Helper: generate deterministic ratings array (copy from ProductCard)
  function generateDeterministicRatings(product) {
    const seed = String(product.product_code || product.id || product.name || 'default');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
    const avg = Math.round((rand() * 0.6 + 4) * 10) / 10; // 4.0 to 4.6
    const ratings = Array(13).fill(0).map(() => 4 + Math.round(rand() * 2)); // 4, 5, or 6
    // Adjust to get close to target avg
    let currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    let i = 0;
    while (Math.abs(currentAvg - avg) > 0.05 && i < 100) {
      const idx = Math.floor(rand() * ratings.length);
      if (currentAvg > avg && ratings[idx] > 4) ratings[idx]--;
      if (currentAvg < avg && ratings[idx] < 5) ratings[idx]++;
      currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      i++;
    }
    return ratings;
  }

  return (
    <div className="bg-white  min-h-screen">
      <BannerCarousel/>
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
                selectedGsm={selectedGsm}
                setSelectedGsm={setSelectedGsm}
                selectedQuantity={selectedQuantity}
                setSelectedQuantity={setSelectedQuantity}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                onCategoryChange={handleCategoryChange}
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
                  selectedGsm={selectedGsm}
                  setSelectedGsm={setSelectedGsm}
                  selectedQuantity={selectedQuantity}
                  setSelectedQuantity={setSelectedQuantity}
                  onClearFilters={handleClearFilters}
                  onApplyFilters={handleApplyFilters}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
