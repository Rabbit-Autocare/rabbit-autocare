"use client"

import { useEffect } from "react"
import { Star } from "lucide-react"

const FilterSidebar = ({
  selectedSize,
  setSelectedSize,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  priceRange,
  setPriceRange,
  category,
  selectedRating,
  setSelectedRating,
  inStockOnly,
  setInStockOnly,
  selectedColor,
  setSelectedColor,
  selectedGsm,
  setSelectedGsm,
  selectedQuantity,
  setSelectedQuantity,
  onClearFilters,
  onApplyFilters,
  onCategoryChange,
  products = [],
}) => {
  // Define filter options based on actual product data
  const CATEGORIES = [
    { value: "all", label: "All Products" },
    { value: "microfiber-cloth", label: "Microfibers" },
    { value: "car-interior", label: "Car Interior" },
    { value: "car-exterior", label: "Car Exterior" },
    { value: "kits-combos", label: "Kits & Combos" },
  ]

  // Extract unique filter options from ALL products (static)
  const extractFilterOptions = () => {
    const sizes = new Set()
    const colors = new Set()
    const gsmValues = new Set()
    const quantities = new Set()
    let minProductPrice = Number.POSITIVE_INFINITY
    let maxProductPrice = 0

    // Always use all products to maintain static filter options
    products.forEach((product) => {
      // Extract filter options from variants
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant) => {
          // Handle size (could be size or size_cm)
          if (variant.size) sizes.add(variant.size)
          if (variant.size_cm) sizes.add(variant.size_cm)

          // Handle color
          if (variant.color) colors.add(variant.color)

          // Handle GSM for microfiber products
          if (variant.gsm) gsmValues.add(variant.gsm)

          // Handle quantity for non-microfiber products
          if (variant.quantity) quantities.add(variant.quantity)

          // Track price range
          if (variant.price) {
            minProductPrice = Math.min(minProductPrice, Number.parseFloat(variant.price))
            maxProductPrice = Math.max(maxProductPrice, Number.parseFloat(variant.price))
          }
        })
      }

      // Also check product-level properties
      if (product.size) sizes.add(product.size)
      if (product.color) colors.add(product.color)
      if (product.gsm) gsmValues.add(product.gsm)
      if (product.quantity) quantities.add(product.quantity)
      if (product.price) {
        minProductPrice = Math.min(minProductPrice, Number.parseFloat(product.price))
        maxProductPrice = Math.max(maxProductPrice, Number.parseFloat(product.price))
      }
    })

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
      gsmValues: Array.from(gsmValues).sort((a, b) => Number(a) - Number(b)),
      quantities: Array.from(quantities).sort((a, b) => {
        // Extract numeric part for sorting
        const numA = Number.parseInt(a.match(/\d+/)?.[0] || "0")
        const numB = Number.parseInt(b.match(/\d+/)?.[0] || "0")
        return numA - numB
      }),
      minPrice: minProductPrice === Number.POSITIVE_INFINITY ? 0 : minProductPrice,
      maxPrice: maxProductPrice || 1000,
    }
  }

  const filterOptions = extractFilterOptions()

  // Update price range when filter options change
  useEffect(() => {
    if (filterOptions.maxPrice > 0 && priceRange[1] === 1000) {
      setPriceRange([filterOptions.minPrice, filterOptions.maxPrice])
      if (!minPrice) setMinPrice(filterOptions.minPrice.toString())
      if (!maxPrice) setMaxPrice(filterOptions.maxPrice.toString())
    }
  }, [filterOptions.maxPrice, filterOptions.minPrice])

  // Handle price range change - only allow max price to change
  const handlePriceRangeChange = (e) => {
  const value = Number.parseInt(e.target.value)
  const newRange = [filterOptions.minPrice, value]

  // Use requestAnimationFrame for smoother updates
  requestAnimationFrame(() => {
    setPriceRange(newRange)
    setMinPrice(filterOptions.minPrice.toString())
    setMaxPrice(value.toString())
  })
}

  // Determine which filters to show based on category
  const getFilterVisibility = () => {
    switch (category) {
      case "microfiber-cloth":
      case "microfiber":
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: false,
          showAllFilters: false,
        }
      case "car-interior":
      case "car-exterior":
        return {
          showMicrofiberFilters: false,
          showCarCareFilters: true,
          showAllFilters: false,
        }
      case "kits-combos":
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: true,
          showAllFilters: true,
        }
      case "all":
      default:
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: true,
          showAllFilters: true,
        }
    }
  }

  const { showMicrofiberFilters, showCarCareFilters } = getFilterVisibility()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className=" text-sm font-medium text-gray-900">FILTER</h2>
        <button onClick={onClearFilters} className="text-xs border border-black text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {/* Categories */}
        <div>
          <h3 className=" text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">CATEGORY</h3>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <label key={cat.value} className=" ml-2 flex items-center">
               <input
  type="radio"
  name="category"
  checked={category === cat.value}
  onChange={() => onCategoryChange(cat.value)}
  className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
/>
                <span className="ml-2 text-lg md:text-xs text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">RATING</h3>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="ml-2 flex items-center">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => setSelectedRating(rating)}
                   className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
                />
                <div className="ml-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 md:h-3 md:w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="ml-1 text-lg md:text-xs text-gray-700">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">AVAILABILITY</h3>
          <label className=" ml-2 flex items-center">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
            />
            <span className="ml-2 text-lg md:text-xs text-gray-700">In Stock Only</span>
          </label>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm md:text-xs font-medium text-gray-900 mb-2 uppercase">PRICE</h3>
          <div className="space-y-2">
            {/* Price display above slider */}
            <div className="text-sm md:text-xs text-gray-600">
              ₹{filterOptions.minPrice} to ₹{priceRange[1]}
            </div>
            {/* Custom slider that only moves from max side */}
            <div className="relative">
              <input
                type="range"
                min={filterOptions.minPrice}
                max={filterOptions.maxPrice}
                value={priceRange[1]}
                onInput={handlePriceRangeChange}
                onChange={handlePriceRangeChange}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                style={{
                  background: `linear-gradient(to right, #601e8d 0%, #601e8d ${
                    ((priceRange[1] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) * 100
                  }%, #e5e7eb ${
                    ((priceRange[1] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Size (for microfiber products) */}
        {showMicrofiberFilters && filterOptions.sizes.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">SIZE</h3>
            <div className="space-y-1">
              {filterOptions.sizes.map((size) => (
                <label key={size} className=" ml-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSize.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSize([...selectedSize, size])
                      } else {
                        setSelectedSize(selectedSize.filter((s) => s !== size))
                      }
                    }}
                      className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{size}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {filterOptions.colors.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">COLOR</h3>
            <div className="space-y-1">
              {filterOptions.colors.map((color) => (
                <label key={color} className="flex items-center cursor-pointer">
                  <div className="ml-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedColor.includes(color)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColor([...selectedColor, color])
                        } else {
                          setSelectedColor(selectedColor.filter((c) => c !== color))
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border mr-2 ${
                        selectedColor.includes(color) ? "border-purple-800 border-2" : "border-gray-300"
                      }`}
                      style={{
                        backgroundColor:
                          color.toLowerCase() === "white"
                            ? "#ffffff"
                            : color.toLowerCase() === "black"
                              ? "#000000"
                              : color.toLowerCase() === "blue"
                                ? "#3b82f6"
                                : color.toLowerCase() === "purple"
                                  ? "#8b5cf6"
                                  : color.toLowerCase() === "green"
                                    ? "#10b981"
                                    : color.toLowerCase() === "red"
                                      ? "#ef4444"
                                      : color.toLowerCase() === "yellow"
                                        ? "#f59e0b"
                                        : color.toLowerCase() === "orange"
                                          ? "#f97316"
                                          : color.toLowerCase() === "pink"
                                            ? "#ec4899"
                                            : color.toLowerCase() === "gray" || color.toLowerCase() === "grey"
                                              ? "#6b7280"
                                              : "#9ca3af",
                      }}
                    />
                    <span className="text-lg md:text-xs text-gray-700 capitalize">{color}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* GSM (for microfiber products) */}
        {showMicrofiberFilters && filterOptions.gsmValues.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">GSM</h3>
            <div className="space-y-1">
              {filterOptions.gsmValues.map((gsm) => (
                <label key={gsm} className="ml-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedGsm.includes(gsm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGsm([...selectedGsm, gsm])
                      } else {
                        setSelectedGsm(selectedGsm.filter((g) => g !== gsm))
                      }
                    }}
                     className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{gsm} GSM</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity (for non-microfiber products) */}
        {showCarCareFilters && filterOptions.quantities.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">QUANTITY</h3>
            <div className="space-y-1">
              {filterOptions.quantities.map((quantity) => (
                <label key={quantity} className="ml-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuantity.includes(quantity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuantity([...selectedQuantity, quantity])
                      } else {
                        setSelectedQuantity(selectedQuantity.filter((q) => q !== quantity))
                      }
                    }}
                      className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
  style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{quantity}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Apply Filters Button */}
        <button
          onClick={onApplyFilters}
          className="w-full bg-black text-white py-2 px-4 rounded text-xs font-medium hover:bg-gray-800 transition-colors mt-4"
        >
          Apply
        </button>
      </div>
<style jsx>{`
        .slider-purple {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          transition: all 0.2s ease-in-out;
          touch-action: pan-x;
          user-select: none;
        }

        .slider-purple::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #601e8d;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(96, 30, 141, 0.3);
          transition: all 0.15s ease-in-out;
          touch-action: pan-x;
        }

        .slider-purple::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(96, 30, 141, 0.4);
        }

        .slider-purple::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }

        .slider-purple::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #601e8d;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(96, 30, 141, 0.3);
          transition: all 0.15s ease-in-out;
          -moz-appearance: none;
        }

        .slider-purple::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(96, 30, 141, 0.4);
        }

        .slider-purple::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: transparent;
        }

        .slider-purple::-ms-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #601e8d;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(96, 30, 141, 0.3);
        }

        .custom-radio {
          accent-color: #601e8d;
        }

        .custom-radio:checked {
          background-color: #601e8d;
          border-color: #601e8d;
        }

        .custom-radio:focus {
          ring-color: #601e8d;
          border-color: #601e8d;
        }
      `}</style>
    </div>
  )
}

export default FilterSidebar
