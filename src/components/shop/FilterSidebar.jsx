"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { ProductService } from "@/lib/service/productService"
import {
  CategoryService,
  SizeService,
  ColorService,
  GsmService,
  QuantityService
} from "@/lib/service/microdataService"

const FilterSidebar = ({
  initialCategories = [],
  initialError = null,
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
}) => {
  // State for all filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: initialCategories.length
      ? [
          { value: "all", label: "All Products" },
          ...initialCategories.map(cat => ({
            value: cat.name.toLowerCase().replace(/\s+/g, '-'),
            label: cat.name,
            is_microfiber: cat.is_microfiber || false
          }))
        ]
      : [],
    sizes: [],
    colors: [],
    gsmValues: [],
    quantities: [],
    priceRange: [0, 1000],
  })
  const [loading, setLoading] = useState(!initialCategories.length)

  // Fetch all filter data on component mount
  useEffect(() => {
    const fetchFilterData = async () => {
      console.log('[DEBUG] Fetching all filter data...');
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [categoriesRes, sizesRes, colorsRes, gsmRes, quantitiesRes] = await Promise.all([
          CategoryService.getCategories(),
          SizeService.getSizes(),
          ColorService.getColors(),
          GsmService.getGSM(),
          QuantityService.getQuantities(),
        ])

        // Determine price range from products
        const productsRes = await ProductService.getProducts({ limit: 1000 })
        const products = productsRes.products || []
        let minProductPrice = Infinity
        let maxProductPrice = 0

        products.forEach(product => {
          const variants = product.variants || []
          variants.forEach(variant => {
            const price = parseFloat(variant.price) || 0
            minProductPrice = Math.min(minProductPrice, price)
            maxProductPrice = Math.max(maxProductPrice, price)
          })
        })

        // Set all filter options
        setFilterOptions(prevOptions => ({
          ...prevOptions,
          categories: [
            { value: "all", label: "All Products" },
            ...(categoriesRes.data || []).map(cat => ({
              value: cat.name.toLowerCase().replace(/\s+/g, '-'),
              label: cat.name,
              is_microfiber: cat.is_microfiber || false
            }))
          ],
          sizes: (sizesRes.data || []).map(size => ({
            id: size.id,
            name: size.size_cm
          })),
          colors: (colorsRes.data || []).map(color => ({
            id: color.id,
            name: color.color,
            hex: color.hex_code
          })),
          gsmValues: (gsmRes.data || []).map(gsm => ({
            id: gsm.id,
            value: gsm.gsm
          })),
          quantities: (quantitiesRes.data || []).map(qty => ({
            id: qty.id,
            value: qty.quantity,
            unit: qty.unit
          })),
          priceRange: [
            minProductPrice === Infinity ? 0 : minProductPrice,
            maxProductPrice === 0 ? 1000 : maxProductPrice
          ]
        }))

        // Initialize price range state
        if (priceRange[1] === 1000) {
          setPriceRange([
            minProductPrice === Infinity ? 0 : minProductPrice,
            maxProductPrice === 0 ? 1000 : maxProductPrice
          ])
          setMinPrice((minProductPrice === Infinity ? 0 : minProductPrice).toString())
          setMaxPrice((maxProductPrice === 0 ? 1000 : maxProductPrice).toString())
        }

        console.log('[DEBUG] Filter data fetched:', {
          categories: categoriesRes,
          sizes: sizesRes,
          colors: colorsRes,
          gsm: gsmRes,
          quantities: quantitiesRes,
          products: productsRes
        });
      } catch (error) {
        console.error("Error fetching filter data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!initialCategories.length) {
      fetchFilterData()
    } else {
      setLoading(false)
    }
  }, [initialCategories])

  // Handle price range change
  const handlePriceRangeChange = (e) => {
    const value = Number(e.target.value)
    const newRange = [filterOptions.priceRange[0], value]

    setPriceRange(newRange)
    setMinPrice(filterOptions.priceRange[0].toString())
    setMaxPrice(value.toString())
  }

  // Determine which filters to show based on category
  const getFilterVisibility = () => {
    switch (category) {
      case "microfiber-cloth":
        return { showMicrofiberFilters: true, showCarCareFilters: false }
      case "car-interior":
      case "car-exterior":
        return { showMicrofiberFilters: false, showCarCareFilters: true }
      case "kits-combos":
        return { showMicrofiberFilters: true, showCarCareFilters: true }
      default:
        return { showMicrofiberFilters: true, showCarCareFilters: true }
    }
  }

  const { showMicrofiberFilters, showCarCareFilters } = getFilterVisibility()

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded w-3/4"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">FILTER</h2>
        <button
          onClick={onClearFilters}
          className="text-xs border border-black text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {/* Categories */}
        <div>
          <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">CATEGORY</h3>
          <div className="space-y-1">
            {filterOptions.categories.map((cat) => {
              // Normalize both the current category and the category value for comparison
              const normalizedCurrentCategory = category.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const normalizedCatValue = cat.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const isSelected = normalizedCurrentCategory === normalizedCatValue;

              return (
                <label key={cat.value} className="ml-2 flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={isSelected}
                    onChange={() => {
                      console.log("Category radio changed:", {
                        from: normalizedCurrentCategory,
                        to: cat.value,
                        normalizedTo: normalizedCatValue,
                        isSelected
                      });

                      // Only trigger change if it's a different category
                      if (onCategoryChange && normalizedCurrentCategory !== normalizedCatValue) {
                        onCategoryChange(cat.value);
                      }
                    }}
                    className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
                    style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{cat.label}</span>
                </label>
              );
            })}
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
          <label className="ml-2 flex items-center">
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
            <div className="text-sm md:text-xs text-gray-600">
              ₹{filterOptions.priceRange[0]} to ₹{priceRange[1]}
            </div>
            <div className="relative">
              <input
                type="range"
                min={filterOptions.priceRange[0]}
                max={filterOptions.priceRange[1]}
                value={priceRange[1]}
                onChange={handlePriceRangeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                style={{
                  background: `linear-gradient(to right, #601e8d 0%, #601e8d ${
                    ((priceRange[1] - filterOptions.priceRange[0]) / (filterOptions.priceRange[1] - filterOptions.priceRange[0])) * 100
                  }%, #e5e7eb ${
                    ((priceRange[1] - filterOptions.priceRange[0]) / (filterOptions.priceRange[1] - filterOptions.priceRange[0])) * 100
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
                <label key={size.id} className="ml-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSize.includes(size.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSize([...selectedSize, size.name])
                      } else {
                        setSelectedSize(selectedSize.filter((s) => s !== size.name))
                      }
                    }}
                    className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
                    style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{size.name} cm</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Color with Hex Codes */}
        {filterOptions.colors.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xs font-medium text-gray-900 mb-2 uppercase">COLOR</h3>
            <div className="space-y-1">
              {filterOptions.colors.map((color) => (
                <label key={color.id} className="flex items-center cursor-pointer">
                  <div className="ml-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedColor.includes(color.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColor([...selectedColor, color.name])
                        } else {
                          setSelectedColor(selectedColor.filter((c) => c !== color.name))
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border mr-2 ${
                        selectedColor.includes(color.name) ? "border-purple-800 border-2" : "border-gray-300"
                      }`}
                      style={{
                        backgroundColor: color.hex,
                        border: (typeof color.hex === 'string' && (color.hex.toLowerCase() === '#ffffff' || color.hex.toLowerCase() === '#fff'))
                          ? selectedColor.includes(color.name)
                            ? '2px solid #601e8d'
                            : '1px solid #d1d5db'
                          : selectedColor.includes(color.name)
                            ? '2px solid #601e8d'
                            : '1px solid #d1d5db'
                      }}
                      title={color.name}
                    />
                    <span className="text-lg md:text-xs text-gray-700 capitalize">{color.name}</span>
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
                <label key={gsm.id} className="ml-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedGsm.includes(gsm.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGsm([...selectedGsm, gsm.value])
                      } else {
                        setSelectedGsm(selectedGsm.filter((g) => g !== gsm.value))
                      }
                    }}
                    className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
                    style={{ accentColor: '#601e8d' }}
                  />
                  <span className="ml-2 text-lg md:text-xs text-gray-700">{gsm.value} GSM</span>
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
              {filterOptions.quantities.map((quantity) => {
                const formatQuantity = (value) => {
                  const num = Number.parseInt(value.toString().replace(/[^\d]/g, ''));
                  if (isNaN(num)) return value; // Return original if not a valid number
                  return num >= 100 ? `${num} ml` : `${num} l`;
                };

                return (
                  <label key={quantity.id} className="ml-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedQuantity.includes(quantity.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuantity([...selectedQuantity, quantity.value])
                        } else {
                          setSelectedQuantity(selectedQuantity.filter((q) => q !== quantity.value))
                        }
                      }}
                      className="h-5 w-5 md:h-3 md:w-3 border-gray-300 focus:ring-purple-500"
                      style={{ accentColor: '#601e8d' }}
                    />
                    <span className="ml-2 text-lg md:text-xs text-gray-700">{formatQuantity(quantity.value)}</span>
                  </label>
                )
              })}
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
      `}</style>
    </div>
  )
}

export default FilterSidebar
