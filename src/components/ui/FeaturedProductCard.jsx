"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, X } from "lucide-react"
import { useCart } from "@/contexts/CartContext.jsx"
import Image from 'next/image'

export default function FeaturedProductCard({ product, className = "" }) {
  const { addToCart, user, cartItems, mounted } = useCart()
  const [imageSlideMap, setImageSlideMap] = useState({})
  const [activeImageIndex, setActiveImageIndex] = useState({})
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  if (!product) return null

  // Check if product is microfiber category
  const isMicrofiber =
    product.is_microfiber === true ||
    (typeof product.category_name === "string" && product.category_name.toLowerCase().includes("microfiber"))

  // Get color for display (could be hex, color name, etc.)
  const getColorStyle = (color) => {
    // If it's a hex color, use it directly
    if (color?.startsWith("#")) {
      return { backgroundColor: color }
    }

    // Find the variant with this color to get its hex code
    const variant = product.variants?.find(v => v.color === color)
    if (variant?.color_hex) {
      return { backgroundColor: variant.color_hex }
    }

    // Color mapping for common color names to hex codes
    const colorMap = {
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      yellow: "#eab308",
      purple: "#a855f7",
      pink: "#ec4899",
      orange: "#f97316",
      gray: "#6b7280",
      grey: "#6b7280",
      black: "#000000",
      white: "#ffffff",
      brown: "#a78bfa",
      navy: "#1e40af",
      teal: "#14b8a6",
      lime: "#84cc16",
      cyan: "#06b6d4",
      indigo: "#6366f1",
      emerald: "#10b981",
      rose: "#f43f5e",
      amber: "#f59e0b",
      violet: "#8b5cf6",
      sky: "#0ea5e9",
      slate: "#64748b",
    }

    // If it's a named color, use the mapping
    const lowerColor = color?.toLowerCase()
    if (colorMap[lowerColor]) {
      return { backgroundColor: colorMap[lowerColor] }
    }

    // Fallback to a default gray
    return { backgroundColor: "#6b7280" }
  }

  // Get unique colors and sizes for all products
  const getUniqueColorsAndSizes = () => {
    if (!product.variants) return { colors: [], sizes: [] }

    // Get unique colors with their hex codes
    const colorMap = new Map()
    product.variants.forEach(variant => {
      if (variant.color && !colorMap.has(variant.color)) {
        colorMap.set(variant.color, variant.color_hex)
      }
    })
    const colors = Array.from(colorMap.keys())

    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))]

    return { colors, sizes }
  }

  const { colors, sizes } = useMemo(() => getUniqueColorsAndSizes(), [product?.variants])

  // Get all available variants (for non-microfiber products)
  const allVariants = useMemo(() => {
    if (!product.variants) return []
    return product.variants
  }, [product?.variants])

  // Initialize with the highest-priced variant
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      // Find the highest-priced variant
      const highestPricedVariant = product.variants.reduce((highest, current) => {
        const currentPrice = current.price || current.mrp || 0
        const highestPrice = highest.price || highest.mrp || 0
        return currentPrice > highestPrice ? current : highest
      })

      setSelectedVariant(highestPricedVariant)

      if (isMicrofiber) {
        // For microfiber, set color and size separately
        if (highestPricedVariant.color) {
          setSelectedColor(highestPricedVariant.color)
        }
        if (highestPricedVariant.size) {
          setSelectedSize(highestPricedVariant.size)
        }
      }
    }
  }, [product, isMicrofiber])

  // Get product images - prioritize thumbnails, fallback to images array, then main image
  const getProductImages = () => {
    if (product.thumbnails && product.thumbnails.length > 0) {
      return product.thumbnails
    }
    if (product.images && product.images.length > 0) {
      return product.images
    }
    if (product.main_image_url) {
      return [product.main_image_url]
    }
    return ["/placeholder.svg?height=400&width=400"]
  }

  const thumbnails = getProductImages()
  const activeIndex = activeImageIndex[product.id] || 0
  const activeSrc = thumbnails[activeIndex] || thumbnails[0]
  const slideData = imageSlideMap[product.id]
  const prevIndex = slideData?.from
  const nextIndex = slideData?.to
  const dir = slideData?.direction

  // Get current price based on selected variant
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price || selectedVariant.mrp || 0
    }
    return product.mrp || product.price || 0
  }

  // Check if a specific color-size combination exists and is in stock
  const getVariantForCombination = (color, size) => {
    if (!isMicrofiber) return null
    return product.variants?.find((v) => v.color === color && v.size === size) || null
  }

  // Check if current selection is available
  const isCurrentSelectionAvailable = () => {
    if (!isMicrofiber) {
      return selectedVariant && selectedVariant.stock > 0
    }

    if (!selectedColor || !selectedSize) return false

    const variant = getVariantForCombination(selectedColor, selectedSize)
    return variant && variant.stock > 0
  }

  // Get variant display text (size only for microfiber, quantity for others)
  const getVariantDisplayText = (variant) => {
    if (isMicrofiber) {
      // For microfiber: display size only (color is handled separately)
      return variant.size || variant.name || "Size"
    } else {
      // For non-microfiber: display quantity with unit
      const quantity = variant.quantity || variant.size || ""
      const unit = variant.unit || ""
      return `${quantity}${unit}` || variant.name || "Variant"
    }
  }

  // Check if a color has any variants in stock
  const isColorAvailable = (color) => {
    return product.variants?.some((v) => v.color === color && v.stock > 0) || false
  }

  // Check if a size has any variants in stock
  const isSizeAvailable = (size) => {
    return product.variants?.some((v) => v.size === size && v.stock > 0) || false
  }

  const handleImageSwipe = (direction) => {
    const currentIndex = activeImageIndex[product.id] || 0
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % thumbnails.length
        : (currentIndex - 1 + thumbnails.length) % thumbnails.length

    setImageSlideMap((prev) => ({
      ...prev,
      [product.id]: {
        from: currentIndex,
        to: nextIndex,
        direction,
      },
    }))

    // Update active index after animation
    setTimeout(() => {
      setActiveImageIndex((prev) => ({ ...prev, [product.id]: nextIndex }))
      setImageSlideMap((prev) => ({ ...prev, [product.id]: null }))
    }, 300) // Reduced from 600ms to 300ms for smoother transition
  }

  const handleVariantSelect = (variant) => {
    // For non-microfiber products
    if (!isMicrofiber) {
      setSelectedVariant(variant)
      return
    }

    // For microfiber products, this shouldn't be called directly
    // Colors and sizes should be handled separately
  }

  const handleColorSelect = (color) => {
    setSelectedColor(color)

    // Update selected variant based on current size selection
    if (selectedSize) {
      const variant = getVariantForCombination(color, selectedSize)
      setSelectedVariant(variant)
    } else {
      // If no size selected, find the highest-priced variant for this color
      const colorVariants = product.variants?.filter((v) => v.color === color) || []
      if (colorVariants.length > 0) {
        const highestPricedVariant = colorVariants.reduce((highest, current) => {
          const currentPrice = current.price || current.mrp || 0
          const highestPrice = highest.price || highest.mrp || 0
          return currentPrice > highestPrice ? current : highest
        })
        setSelectedVariant(highestPricedVariant)
        setSelectedSize(highestPricedVariant.size)
      }
    }
  }

  const handleSizeSelect = (size) => {
    setSelectedSize(size)

    // Update selected variant based on current color selection
    if (selectedColor) {
      const variant = getVariantForCombination(selectedColor, size)
      setSelectedVariant(variant)
    } else {
      // If no color selected, find the highest-priced variant for this size
      const sizeVariants = product.variants?.filter((v) => v.size === size) || []
      if (sizeVariants.length > 0) {
        const highestPricedVariant = sizeVariants.reduce((highest, current) => {
          const currentPrice = current.price || current.mrp || 0
          const highestPrice = highest.price || highest.mrp || 0
          return currentPrice > highestPrice ? current : highest
        })
        setSelectedVariant(highestPricedVariant)
        setSelectedColor(highestPricedVariant.color)
      }
    }
  }

  const handleAddToCart = async () => {
    if (!selectedVariant && !isMicrofiber) {
      alert("Please select a variant.")
      return
    }

    if (isMicrofiber && (!selectedColor || !selectedSize)) {
      alert("Please select a color and size.")
      return
    }

    setIsAddingToCart(true)

    try {
      // Determine the item details to add
      const itemToAdd = {
        productId: product.id,
        quantity: 1,
        price: getCurrentPrice(),
        productName: product.name,
        productImage: product.main_image_url || product.image_url || product.images?.[0] || "",
      }

      if (isMicrofiber) {
        const variant = getVariantForCombination(selectedColor, selectedSize)
        if (!variant) {
          throw new Error("Selected color/size combination not available.")
        }
        itemToAdd.variant = {
          ...variant,
          color: selectedColor,
          size: selectedSize,
          displayText: `${selectedColor} / ${selectedSize}`
        }
      } else if (selectedVariant) {
        itemToAdd.variant = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant)
        }
      } else {
        itemToAdd.variant = {
          id: 'default',
          price: product.price || product.mrp,
          displayText: 'Default'
        }
      }

      // Add the new item
      let existingCart = []
      try {
        const storedCart = localStorage.getItem('cart')
        existingCart = storedCart ? JSON.parse(storedCart) : []
        if (!Array.isArray(existingCart)) {
          existingCart = []
        }
      } catch (e) {
        existingCart = []
      }

      existingCart.push(itemToAdd)
      localStorage.setItem('cart', JSON.stringify(existingCart))
      console.log("Successfully added to cart via localStorage")
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert(`Failed to add item to cart: ${error.message}`)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    // Check if selection is available before buying
    if (isMicrofiber && !isCurrentSelectionAvailable()) {
      console.log("Selected combination is out of stock")
      return
    }

    if (!isMicrofiber && (!selectedVariant || selectedVariant.stock === 0)) {
      console.log("Selected variant is out of stock")
      return
    }

    // Proceed to checkout logic (e.g., redirect to checkout with item details)
    const itemToBuy = {
      productId: product.id || product.product_code,
      variantId: selectedVariant?.id || "default",
      quantity: 1,
      price: getCurrentPrice(),
      variant: isMicrofiber
        ? `${selectedSize} - ${selectedColor}`
        : selectedVariant?.size || selectedVariant?.color || selectedVariant?.quantity || "default",
      productName: product.name,
      productImage: product.main_image_url || product.images?.[0] || thumbnails[0],
    }

    console.log("Proceeding to buy now with:", itemToBuy)
    // Implement actual redirection to checkout with itemToBuy details
    // Example: router.push(`/checkout?item=${JSON.stringify(itemToBuy)}`);
  }

  const handleAddToWishlist = async () => {
    // TODO: Implement actual wishlist functionality
    setIsWishlisted(!isWishlisted)
    console.log(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist:`, product.name)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div
      className={`w-full pt-0 overflow-hidden bg-white border-y border-black featured-product-section h-[800px]lg:h-[700px] ${className}`}
    >
      <div className="flex flex-col xl:flex-row gap-6 px-4 md:px-[30px] lg:px-[50px] py-6 md:py-16 lg:pt-[50px] lg:pb-[0px] items-center justify-between">
        {/* Image Section */}
        <div className="flex w-full xl:w-1/2 items-center justify-center sm:gap-4">
          {/* Thumbnail Navigation */}
          <div className="flex-col space-y-2 items-center hidden md:block">
            {thumbnails.map((thumb, i) => (
              <img
                key={i}
                src={thumb || "/placeholder.svg"}
                alt={`${product.name} thumbnail ${i + 1}`}
                onClick={() => setActiveImageIndex((prev) => ({ ...prev, [product.id]: i }))}
                className={`w-[50px] h-[40px] xl:w-[68px] xl:h-[55px] cursor-pointer transition-all duration-200 ease-in-out ring-2 object-cover ${
                  activeIndex === i ? "ring-black opacity-100" : "ring-transparent opacity-50"
                }`}
              />
            ))}
          </div>

          {/* Main Image Display */}
          <div className="relative w-[460px] h-[300px] sm:w-[500px] sm:h-[350px] md:w-[500px] md:h-[320px] lg:w-[600px] lg:h-[300px] xl:w-[600px] xl:h-[600px] flex items-center justify-center overflow-hidden">
            {/* Left Glass Panel */}
            <div className="absolute left-0 top-0 w-[80px] h-full z-10 pointer-events-none">
              <div className="w-full h-full rounded-none" />
            </div>

            {/* Right Glass Panel */}
            <div className="absolute right-0 top-0 w-[80px] h-full z-10 pointer-events-none">
              <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-none" />
            </div>

            {/* Left Navigation Button */}
            {thumbnails.length > 1 && (
              <button
                onClick={() => handleImageSwipe("prev")}
                className="absolute z-20 left-2 rounded-full bg-white/20 backdrop-blur-xs shadow p-2 transition hover:bg-white/30"
              >
                <ChevronLeft className="w-5 h-5 text-black cursor-pointer" />
              </button>
            )}

            {/* Image Slide Content */}
            <div className="w-full h-full relative z-10 overflow-hidden">
              {slideData ? (
                <>
                  <img
                    key={`prev-${prevIndex}`}
                    src={thumbnails[prevIndex] || "/placeholder.svg"}
                    alt={`${product.name} - previous`}
                    className={`absolute w-full h-full object-contain transition-all duration-300 ease-in-out ${
                      dir === "next" ? "-translate-x-full" : "translate-x-full"
                    }`}
                  />
                  <img
                    key={`next-${nextIndex}`}
                    src={thumbnails[nextIndex] || "/placeholder.svg"}
                    alt={`${product.name} - next`}
                    className={`absolute w-full h-full object-contain transition-all duration-300 ease-in-out ${
                      dir === "next" ? "translate-x-0" : "translate-x-0"
                    }`}
                  />
                </>
              ) : (
                <img
                  key={`active-${activeIndex}`}
                  src={activeSrc || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              )}
            </div>

            {/* Right Navigation Button */}
            {thumbnails.length > 1 && (
              <button
                onClick={() => handleImageSwipe("next")}
                className="absolute right-2 rounded-full bg-white/20 backdrop-blur-xs z-20 shadow p-2 transition hover:bg-white/30"
              >
                <ChevronRight className="w-5 h-5 text-black cursor-pointer" />
              </button>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-[585px] lg:w-[685px] xl:w-1/2 space-y-2 xl:space-y-5">
          <h2 className="product-heading text-[28px] sm:text-[36px] lg:text-[40px] xl:text-[48px] font-semibold tracking-wide">
            {product.name || product.heading}
          </h2>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[12px] md:text-sm xl:text-[12px] font-extralight text-black">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={
                  i < Math.floor(product.rating || product.averageRating || 4)
                    ? "/assets/featured/ratingstar1.svg"
                    : "/assets/featured/ratingstar2.svg"
                }
                alt="star"
                className="w-4 h-4"
              />
            ))}
            <span className="ml-1">| {product.totalRatings || product.reviews?.length || 12} Ratings</span>
          </div>

          {/* Price */}
          <div className="text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide">
            <span className="font-extralight">MRP:</span>
            <span> {formatPrice(getCurrentPrice())}</span>
          </div>

          {/* Description */}
          <p className="text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider whitespace-pre-line line-clamp-2 lg:line-clamp-3 xl:line-clamp-none">
            {product.description}
          </p>

          {/* Color Selection for Microfiber Products */}
          {isMicrofiber && colors.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Choose Color:</h4>
              <div className="flex flex-wrap gap-3">
                {colors.map((color, index) => {
                  const isSelected = selectedColor === color
                  const hasStock = isColorAvailable(color)
                  const colorStyle = getColorStyle(color)

                  return (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => handleColorSelect(color)}
                        disabled={!hasStock}
                        className={`
                          w-8 h-8 rounded-full border-2 transition-all duration-200 relative
                          ${
                            isSelected
                              ? "border-black ring-2 ring-black ring-offset-2"
                              : hasStock
                                ? "border-gray-300 hover:border-gray-400"
                                : "border-gray-200 cursor-not-allowed opacity-50"
                          }
                        `}
                        style={colorStyle}
                        title={color}
                      >
                        {/* White border for white colors */}
                        {color?.toLowerCase() === "white" && (
                          <div className="absolute inset-0 rounded-full border border-gray-300"></div>
                        )}

                        {/* Out of stock indicator */}
                        {!hasStock && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <X className="w-3 h-3 text-gray-600" />
                          </div>
                        )}
                      </button>

                      {/* Color name tooltip */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                        {color}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Size/Variant Selection */}
          {((isMicrofiber && sizes.length > 0) || (!isMicrofiber && allVariants.length > 0)) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{isMicrofiber ? "Choose Size:" : "Choose Quantity:"}</h4>
              <div className="flex flex-wrap gap-2">
                {isMicrofiber
                  ? // For microfiber products, show all available sizes
                    sizes.map((size, index) => {
                      const isSelected = selectedSize === size
                      const hasStock = isSizeAvailable(size)
                      const isCurrentCombinationAvailable = selectedColor ?
                        getVariantForCombination(selectedColor, size)?.stock > 0 : hasStock

                      return (
                        <div key={index} className="relative group">
                          <button
                            onClick={() => handleSizeSelect(size)}
                            className={`
                              px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                              ${
                                isSelected
                                  ? "bg-white text-black border-2 border-black"
                                  : !isCurrentCombinationAvailable && selectedColor
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                              }
                            `}
                          >
                            {size}
                          </button>

                          {/* Out of stock indicator for specific combination */}
                          {!isCurrentCombinationAvailable && selectedColor && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <div className="bg-red-500 text-white rounded-full p-1">
                                <X className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  : // For non-microfiber products, show all variants
                    allVariants.map((variant, index) => {
                      const isOutOfStock = variant.stock === 0
                      const isSelected = selectedVariant?.id === variant.id

                      return (
                        <div key={variant.id || index} className="relative group">
                          <button
                            onClick={() => handleVariantSelect(variant)}
                            disabled={isOutOfStock}
                            className={`
                              px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full
                              ${
                                isSelected
                                  ? "bg-white text-black border-2 border-black"
                                  : isOutOfStock
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                              }
                            `}
                          >
                            {getVariantDisplayText(variant)}
                          </button>

                          {/* Out of stock indicator */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <div className="bg-red-500 text-white rounded-full p-1">
                                <X className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
              </div>

              {/* Stock indicator for selected combination */}
              {isMicrofiber && selectedColor && selectedSize && (
                <div className="text-xs text-gray-600">
                  {(() => {
                    const variant = getVariantForCombination(selectedColor, selectedSize)
                    if (variant && variant.stock > 0) {
                      return <span className="text-green-600">{variant.stock} in stock</span>
                    } else {
                      return <span className="text-red-600">Out of stock</span>
                    }
                  })()}
                </div>
              )}

              {/* Stock indicator for non-microfiber selected variant */}
              {!isMicrofiber && selectedVariant && (
                <div className="text-xs text-gray-600">
                  {selectedVariant.stock > 0 ? (
                    <span className="text-green-600">{selectedVariant.stock} in stock</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center w-full">
              <div className="border-1 border-black px-4 py-2 mr-1 rounded-[4px] xl:block hidden">
                <div className="relative w-5 h-5">
                  <Image
                    src="/assets/featured/cartstar.svg"
                    alt="cart-star"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !isCurrentSelectionAvailable()}
                className="text-sm text-black font-semibold border-1 px-4 py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : !isCurrentSelectionAvailable() ? (
                  "Out of Stock"
                ) : (
                  <>
                    Add to Cart
                    <div className="relative w-5 h-5">
                      <Image
                        src="/assets/featured/cartstar.svg"
                        alt="cart-star"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={!isCurrentSelectionAvailable()}
              className="bg-black cursor-pointer rounded-[4px] text-white w-full px-4 py-3 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {!isCurrentSelectionAvailable() ? "Out of Stock" : "Buy Now"}
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/featured/buynowsvg.svg"
                  alt="buy-now"
                  fill
                  className="object-contain"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
