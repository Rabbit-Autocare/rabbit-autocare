"use client"
import { supabase } from "@/lib/supabase/browser-client"
import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, X ,ShoppingCart} from "lucide-react"
import { useCart } from "@/contexts/CartContext.jsx"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { WishlistService } from '@/lib/service/wishlistService';
import { FaShoppingCart } from "react-icons/fa"
// ...existing imports...
console.log("FeaturedProductCard loaded!");
export default function FeaturedProductCard({ product, className = "", isLastCard = false }) {
  const { addToCart, user, openCart } = useCart()
  const router = useRouter()
  const [imageSlideMap, setImageSlideMap] = useState({})
  const [activeImageIndex, setActiveImageIndex] = useState({})
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [uniqueColorsAndSizes, setUniqueColorsAndSizes] = useState({ colors: [], sizes: [] })
  const [wishlistItemId, setWishlistItemId] = useState(null)

  // Check if product is microfiber category
  const isMicrofiber = useMemo(() => {
    return (
      product?.is_microfiber === true ||
      (typeof product?.category_name === "string" && product?.category_name?.toLowerCase()?.includes("microfiber"))
    )
  }, [product])

  // Check if current product variant is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !product) return;

      try {
        const { data, error } = await WishlistService.getWishlist();
        if (error) {
          console.error('Error checking wishlist status:', error);
          return;
        }

        // Check if current product with selected variant is in wishlist
        const currentVariant = isMicrofiber
          ? getVariantForCombination(selectedColor, selectedSize)
          : selectedVariant;

        const wishlistItem = data?.find(item => {
          if (item.product_id !== product.id) return false;

          if (isMicrofiber && selectedColor && selectedSize) {
            // For microfiber, check color and size combination
            const hasColor = Array.isArray(item.variant?.color)
              ? item.variant.color.includes(selectedColor)
              : item.variant?.color === selectedColor;
            return hasColor && item.variant?.size === selectedSize;
          } else if (currentVariant) {
            // For non-microfiber, check variant match
            return item.variant?.id === currentVariant.id;
          }

          return !item.variant; // Default variant
        });

        if (wishlistItem) {
          setIsWishlisted(true);
          setWishlistItemId(wishlistItem.id);
        } else {
          setIsWishlisted(false);
          setWishlistItemId(null);
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };

    checkWishlistStatus();
  }, [user, product, selectedVariant, selectedColor, selectedSize, isMicrofiber]);

  // Get color for display (could be hex, color name, etc.)
  const getColorStyle = (color) => {
    // If it's a hex color, use it directly
    if (color?.startsWith("#")) {
      return { backgroundColor: color }
    }

    // Find the variant with this color to get its hex code
    const variant = product.variants?.find((v) => {
      if (Array.isArray(v.color)) {
        return v.color.includes(color)
      }
      return v.color === color
    })

    if (variant?.color_hex) {
      let hexCode = variant.color_hex
      if (Array.isArray(hexCode)) {
        hexCode = hexCode[0] // Use first hex code
      }
      return { backgroundColor: hexCode }
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
  useEffect(() => {
    if (!product?.variants) {
      setUniqueColorsAndSizes({ colors: [], sizes: [] })
      return
    }

    // Get unique colors with their hex codes
    const colorMap = new Map()
    product.variants.forEach((variant) => {
      // Handle both string and array color formats
      let colors = []
      if (Array.isArray(variant.color)) {
        colors = variant.color
      } else if (variant.color) {
        colors = [variant.color]
      }

      colors.forEach(color => {
        if (color && !colorMap.has(color)) {
          // Handle both string and array color_hex formats
          let colorHex = null
          if (Array.isArray(variant.color_hex)) {
            colorHex = variant.color_hex[0] // Use first hex code
          } else if (variant.color_hex) {
            colorHex = variant.color_hex
          }
          colorMap.set(color, colorHex)
        }
      })
    })
    const colors = Array.from(colorMap.keys())

    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))]

    setUniqueColorsAndSizes({ colors, sizes })
  }, [product?.variants])

  const { colors, sizes } = uniqueColorsAndSizes

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
        const currentPrice = current.base_price || current.price || current.mrp || 0
        const highestPrice = highest.base_price || highest.price || highest.mrp || 0
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
      return selectedVariant.base_price || selectedVariant.price || selectedVariant.mrp || 0
    }
    return product.base_price || product.price || product.mrp || 0
  }

  // Check if a specific color-size combination exists and is in stock
  const getVariantForCombination = (color, size) => {
    if (!isMicrofiber) return null
    return product.variants?.find((v) => {
      const hasColor = Array.isArray(v.color) ? v.color.includes(color) : v.color === color
      return hasColor && v.size === size
    }) || null
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

  // Helper to extract pack size from variant code (e.g., RX-MF-20A-1X => 1, RX-MF-20A-5X => 5)
  const extractPackSize = (variantCode) => {
    const match = typeof variantCode === 'string' ? variantCode.match(/-(\d+)X$/i) : null;
    return match ? parseInt(match[1], 10) : 1;
  };

  // Get variant display text (size only for microfiber, quantity for others)
  const getVariantDisplayText = (variant) => {
    if (isMicrofiber) {
      // For microfiber: display size in cm only, remove any other units
      let size = variant.size || variant.name || "Size";
      // Remove any trailing unit (ml, ltr, gm, etc.), even if attached (e.g., '40x40ml')
      size = size.replace(/(ml|ltr|l|gm|g|kg|pcs?|pieces?)$/gi, '').replace(/\b(ml|ltr|l|gm|g|kg|pcs?|pieces?)\b/gi, '').replace(/\s+/g, ' ').trim();
      // Ensure it ends with 'cm'
      if (!/cm$/i.test(size)) {
        size = size + ' cm';
      } else {
        size = size.replace(/\s*cm$/i, '') + ' cm';
      }
      return size;
    } else {
      const quantity = variant.quantity || variant.size || "";
      const unit = variant.unit || "";
      return `${quantity}${unit}` || variant.name || "Variant";
    }
  }

  // Check if a color has any variants in stock
  const isColorAvailable = (color) => {
    return product.variants?.some((v) => {
      const hasColor = Array.isArray(v.color) ? v.color.includes(color) : v.color === color
      return hasColor && v.stock > 0
    }) || false
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
    }, 300)
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
      const colorVariants = product.variants?.filter((v) => {
        if (Array.isArray(v.color)) {
          return v.color.includes(color)
        }
        return v.color === color
      }) || []
      if (colorVariants.length > 0) {
        const highestPricedVariant = colorVariants.reduce((highest, current) => {
          const currentPrice = current.base_price || current.price || current.mrp || 0
          const highestPrice = highest.base_price || highest.price || highest.mrp || 0
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
          const currentPrice = current.base_price || current.price || current.mrp || 0
          const highestPrice = highest.base_price || highest.price || highest.mrp || 0
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
          displayText: selectedSize // Only show size for microfiber
        }
      } else if (selectedVariant) {
        itemToAdd.variant = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant)
        }
      } else {
        itemToAdd.variant = {
          id: 'default',
          price: product.base_price || product.price || product.mrp,
          displayText: 'Default'
        }
      }

      console.log('FeaturedProductCard: Adding PRODUCT to cart:', { product, variant: itemToAdd.variant, quantity: 1 });
      const success = await addToCart(product, itemToAdd.variant, 1)

      if (success) {
        console.log("Successfully added to cart.")
        openCart()
      } else {
        alert("Failed to add item to cart.")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert(`Failed to add item to cart: ${error.message}`)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isCurrentSelectionAvailable()) {
      alert("Please select available variant.")
      return
    }

    setIsAddingToCart(true)

    try {
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
          displayText: selectedSize // Only show size for microfiber
        }
      } else if (selectedVariant) {
        itemToAdd.variant = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant)
        }
      } else {
        itemToAdd.variant = {
          id: 'default',
          price: product.base_price || product.price || product.mrp,
          displayText: 'Default'
        }
      }

      console.log('FeaturedProductCard: BuyNow PRODUCT addToCart:', { product, variant: itemToAdd.variant, quantity: 1 });
      const success = await addToCart(product, itemToAdd.variant, 1)

      if (success) {
        console.log("Item added to cart, redirecting to checkout.")
        router.push('/checkout')
      } else {
        alert("Failed to add item to cart for direct purchase.")
      }
    } catch (error) {
      console.error("Error during Buy Now:", error)
      alert(`Failed to complete purchase: ${error.message}`)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!user) {
      alert("Please login to add items to wishlist.");
      return;
    }

    try {
      let variantToSave = null;

      if (isMicrofiber && selectedColor && selectedSize) {
        const variant = getVariantForCombination(selectedColor, selectedSize);
        if (!variant) {
          alert("Please select a valid color and size combination.");
          return;
        }
        variantToSave = {
          ...variant,
          color: selectedColor,
          size: selectedSize,
          displayText: selectedSize // Only show size for microfiber
        };
      } else if (selectedVariant) {
        variantToSave = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant)
        };
      } else {
        // Default variant for products without variants
        variantToSave = {
          id: 'default',
          price: product.base_price || product.price || product.mrp,
          displayText: 'Default'
        };
      }

      if (isWishlisted && wishlistItemId) {
        // Remove from wishlist
        const { error } = await WishlistService.removeFromWishlist(wishlistItemId);
        if (error) {
          console.error('Error removing from wishlist:', error);
          alert('Could not remove from wishlist.');
        } else {
          setIsWishlisted(false);
          setWishlistItemId(null);
        }
      } else {
        // Add to wishlist
        const { data, error } = await WishlistService.addToWishlist({
          product_id: product.id,
          variant: variantToSave,
        });

        if (error) {
          console.error('Error adding to wishlist:', error);
          alert('Could not add to wishlist.');
        } else {
          setIsWishlisted(true);
          setWishlistItemId(data?.[0]?.id);
        }
      }
    } catch (err) {
      console.error('Error with wishlist operation:', err);
      alert('Could not update wishlist.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!product) return null

  return (
    <div className={`w-full pt-0 overflow-visible bg-white featured-product-section ${className}`}>
      <div
        className={`flex flex-col lg:flex-row gap-4 sm:gap-6 px-4 md:px-[30px] lg:px-4 pt-6 md:pt-16 lg:pt-[30px] items-center ${
          isLastCard
            ? "pb-[0px] xs:pb-[0px] sm:pb-[0px] md:pb-[0px] lg:pb-[0px] xl:pb-[50px]"
            : "pb-[0px] sm:pb-[160px] md:pb-[180px] lg:pb-[80px] xl:pb-[80px]"
        }`}
      >
        {/* Image Section */}
        <div className="flex w-full lg:w-1/2 items-start justify-center sm:gap-4">
          {/* Thumbnail Navigation */}
          <div className="flex-col space-y-2 items-start hidden md:block mt-2">
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
          <div className="relative w-full h-[250px] xs:w-[350px] xs:h-[280px] sm:w-[500px] sm:h-[350px] md:w-[500px] md:h-[320px] lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px] flex items-center justify-center overflow-hidden">
            {/* Left Navigation Button */}
            {thumbnails.length > 1 && (
              <button
                onClick={() => handleImageSwipe("prev")}
                className="absolute z-20 left-0 cursor-pointer bg-transparent p-1 sm:p-2 transition"
              >
                <ChevronLeft className="w-8 h-8 sm:w-12 sm:h-12 xl:h-[600px] text-black cursor-pointer" />
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
                className="absolute right-0 cursor-pointer bg-transparent z-20 p-1 sm:p-2 transition"
              >
                <ChevronRight className="w-8 h-8 sm:w-12 sm:h-12 xl:h-[600px] text-black cursor-pointer" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Thumbnails */}
        <div className="flex flex-row justify-start space-x-2 md:hidden overflow-x-auto w-full">
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

        {/* Product Details */}
        <div className="w-full md:w-[585px] lg:w-[685px] xl:w-1/2 space-y-2 md:space-y-3 lg:space-y-2 xl:space-y-5 flex flex-col min-h-[400px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[550px] xl:min-h-[600px]">
          <h2 className="product-heading text-[20px] xs:text-[22px] sm:text-[34px] lg:text-[35px] xl:text-[38px] 2xl:text-[41px] font-semibold tracking-wide">
            {product.name || product.heading}
          </h2>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] xs:text-[12px] md:text-sm xl:text-[12px] font-extralight text-black">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={
                  i < Math.floor(product.rating || product.averageRating || 4)
                    ? "/assets/featured/ratingstar1.svg"
                    : "/assets/featured/ratingstar2.svg"
                }
                alt="star"
                className="w-3 h-3 xs:w-4 xs:h-4"
              />
            ))}
            <span className="ml-1">| {product.totalRatings || product.reviews?.length || 12} Ratings</span>
          </div>

          {/* Price */}
          <div className="text-[18px] xs:text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide">
            <span className="font-extralight">MRP:</span>
            <span> {formatPrice(getCurrentPrice())}</span>
          </div>

          {/* Description */}
          <div className="xl:flex-grow">
            <p className="text-[13px] xs:text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider whitespace-pre-line line-clamp-2 xs:line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-4 xl:line-clamp-none">
              {product.description}
            </p>
          </div>

          {/* Variant Selection (separate logic for microfiber and regular) */}
          {isMicrofiber ? (
            sizes.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-xs xs:text-sm">Choose Size:</h4>
                <div className="flex flex-wrap gap-1 xs:gap-2">
                  {product.variants.filter(v => v.size).map((variant, index) => {
                    const isSelected = selectedSize === variant.size;
                    const isOutOfStock = variant.stock === 0;
                    // Use getVariantDisplayText for consistent size display
                    const size = getVariantDisplayText(variant);
                    const packSize = extractPackSize(variant.variant_code || variant.code || variant.id);
                    return (
                      <div key={variant.id || index} className="relative group">
                        <button
                          onClick={() => {
                            setSelectedSize(variant.size);
                            setSelectedVariant(variant);
                          }}
                          disabled={isOutOfStock}
                          className={
                            `px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 text-xs xs:text-sm font-medium transition-all duration-200 rounded-full ` +
                            (isSelected
                              ? "bg-white text-black border-2 border-black"
                              : isOutOfStock
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent")
                          }
                        >
                          <div className="flex flex-col items-center leading-tight">
                            <span className="font-semibold">{size}</span>
                            {packSize > 1 && (
                              <span className="text-xs text-gray-500">Pack of {packSize}</span>
                            )}
                          </div>
                        </button>
                        {/* Out of stock indicator */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-red-500 text-white rounded-full p-1">
                              <X className="w-2 h-2 xs:w-3 xs:h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Always show confirmation block for microfiber */}
                {(() => {
                  // Use selectedVariant or first available variant
                  const variant = selectedVariant || product.variants.find(v => v.size);
                  if (!variant) return null;
                  const size = getVariantDisplayText(variant);
                  const packSize = extractPackSize(variant.variant_code || variant.code || variant.id);
                  return (
                    <div className="mt-2 flex flex-col items-start text-xs text-blue-700">
                      <div><span className="font-semibold">Selected Size:</span> {size}</div>
                      <div><span className="font-semibold">Selected Pack Size:</span> Pack of {packSize}</div>
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            allVariants.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-xs xs:text-sm">Choose Quantity:</h4>
                <div className="flex flex-wrap gap-1 xs:gap-2">
                  {allVariants.map((variant, index) => {
                    const isOutOfStock = variant.stock === 0;
                    const isSelected = selectedVariant?.id === variant.id;
                    const quantity = variant.quantity || variant.size || "";
                    const unit = variant.unit || "";
                    return (
                      <div key={variant.id || index} className="relative group">
                        <button
                          onClick={() => handleVariantSelect(variant)}
                          disabled={isOutOfStock}
                          className={`
                            px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 text-xs xs:text-sm font-medium transition-all duration-200 rounded-full
                            ${
                              isSelected
                                ? "bg-white text-black border-2 border-black"
                                : isOutOfStock
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                            }
                          `}
                        >
                          <span>{`${quantity}${unit}`}</span>
                        </button>
                        {/* Out of stock indicator */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-red-500 text-white rounded-full p-1">
                              <X className="w-2 h-2 xs:w-3 xs:h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

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

          {/* Action Buttons */}
          <div className="space-y-2 xl:space-y-4 relative z-10 mt-4 sm:mt-6">
            <div className="flex items-center w-full">
              <div className={`border-1 px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 mr-1 rounded-[4px] transition-all duration-200 ${
                isWishlisted
                  ? "border-red-500 bg-red-50"
                  : "border-black hover:bg-gray-50"
              }`}>
                <div className="relative w-4 h-4 xs:w-5 xs:h-5 cursor-pointer">
                  <button
                    type="button"
                    onClick={handleAddToWishlist}
                    disabled={!user}
                    className={`text-xs transition-all duration-200 ${
                      isWishlisted
                        ? "text-red-500"
                        : "text-black hover:text-purple-600"
                    } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={!user ? "Login to add to wishlist" : isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isWishlisted ? (
                      <div className="relative w-4 h-4 xs:w-5 xs:h-5">
                        <Image
                          src="/assets/shine.svg"
                          alt="wishlisted"
                          fill
                          className="object-contain animate-pulse"
                        />
                      </div>
                    ) : (
                      <div className="relative w-4 h-4 xs:w-5 xs:h-5">
                        <Image
                          src="/assets/shine.svg"
                          alt="add to wishlist"
                          fill
                          className="object-contain opacity-60 hover:opacity-100 transition-opacity duration-200"
                        />
                      </div>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !isCurrentSelectionAvailable()}
                className="text-xs xs:text-sm text-black font-semibold border-1 px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="hidden xs:inline">Adding...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : !isCurrentSelectionAvailable() ? (
                  "Out of Stock"
                ) : (
                  <>
                    Add to Cart
                    <ShoppingCart className="w-4 h-4 xs:w-5 xs:h-5" />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={!isCurrentSelectionAvailable()}
              className="bg-black cursor-pointer rounded-[4px] text-white w-full px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-3 flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 text-xs xs:text-sm"
            >
              {!isCurrentSelectionAvailable() ? "Out of Stock" : "Buy Now"}
              <div className="relative w-4 h-4 xs:w-5 xs:h-5">
                <Image src="/assets/featured/buynowsvg.svg" alt="buy-now" fill className="object-contain" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
