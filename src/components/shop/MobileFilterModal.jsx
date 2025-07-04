"use client"

import { useEffect } from "react"
import { Star, X } from "lucide-react"

const MobileFilterModal = ({
  isOpen,
  onClose,
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
  // Replace dynamic extraction with static values
  const STATIC_CATEGORIES = [
    { value: "all", label: "All Products" },
    { value: "car-interior", label: "Car Interior" },
    { value: "car-exterior", label: "Car Exterior" },
    { value: "microfiber-cloth", label: "Microfiber Cloth" },
    { value: "kits-combos", label: "Kits & Combos" },
  ];
  const STATIC_SIZES = ["40x40", "40x60"];
  const STATIC_GSM = [
    "200", "280", "350", "380", "420", "500", "600", "750", "800", "1000", "1200", "Rabbit fur 1X", "Rabbit fur 2X"
  ];
  const STATIC_QUANTITIES = ["100ml", "250ml", "500ml", "1L", "5L"];
  const STATIC_PRICE_RANGE = [0, 1000];

  // Handle price range change - only allow max price to change
  const handlePriceRangeChange = (e) => {
    const value = Number.parseInt(e.target.value)
    const newRange = [minPrice, value]
    setPriceRange(newRange)
    setMinPrice(minPrice.toString())
    setMaxPrice(value.toString())
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="bg-white w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-medium text-gray-900">FILTER</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClearFilters} className="text-sm text-blue-600 hover:text-blue-800">
              Clear all
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">CATEGORY</h3>
            <div className="space-y-2">
              {STATIC_CATEGORIES.map((cat) => (
                <label key={cat.value} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={category === cat.value}
                    onChange={() => onCategoryChange(cat.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">RATING</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating}
                    onChange={() => setSelectedRating(rating)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-2 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-700">& up</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">AVAILABILITY</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">PRICE</h3>
            <div className="space-y-3">
              {/* Price display above slider */}
              <div className="text-sm text-gray-600">
                ₹{minPrice} to ₹{priceRange[1]}
              </div>
              {/* Custom slider that only moves from max side */}
              <div className="relative">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={handlePriceRangeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      ((priceRange[1] - minPrice) / (maxPrice - minPrice)) *
                      100
                    }%, #e5e7eb ${
                      ((priceRange[1] - minPrice) / (maxPrice - minPrice)) *
                      100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Size (for microfiber products) */}
          {showMicrofiberFilters && STATIC_SIZES.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">SIZE</h3>
              <div className="space-y-2">
                {STATIC_SIZES.map((size) => (
                  <label key={size} className="flex items-center">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity (for non-microfiber products) */}
          {showCarCareFilters && STATIC_QUANTITIES.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">QUANTITY</h3>
              <div className="space-y-2">
                {STATIC_QUANTITIES.map((quantity) => (
                  <label key={quantity} className="flex items-center">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{quantity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* GSM (for microfiber products) */}
          {showMicrofiberFilters && STATIC_GSM.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">GSM</h3>
              <div className="space-y-2">
                {STATIC_GSM.map((gsm) => (
                  <label key={gsm} className="flex items-center">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{gsm} GSM</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onApplyFilters}
            className="w-full bg-black text-white py-3 px-4 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        <style jsx>{`
          .slider-blue::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .slider-blue::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
    </div>
  )
}

export default MobileFilterModal
