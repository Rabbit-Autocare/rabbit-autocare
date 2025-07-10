"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight,  X, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext.jsx"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { ProductService } from '@/lib/service/productService'

export default function KitComboCard({ product, className = "", isLastCard = false }) {
  const { addToCart, user, openCart } = useCart()
  const router = useRouter()
  const [imageSlideMap, setImageSlideMap] = useState({})
  const [activeImageIndex, setActiveImageIndex] = useState({})
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Determine included products (kit or combo)
  const includedProducts = product.kit_products || product.combo_products || [];

  // Check if all included variants are in stock
  const isAvailable = includedProducts.every(item => item.variant && item.variant.stock > 0);

  // Get product images - prioritize main_image_url, then images array
  const getProductImages = () => {
    if (product.main_image_url) {
      const images = [product.main_image_url]
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Add other images, avoiding duplicates
        product.images.forEach(img => {
          if (img !== product.main_image_url) {
            images.push(img)
          }
        })
      }
      return images
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    if (product.image_url) {
      return [product.image_url]
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

  // Debug: Log the product data for kits/combos only when product changes
  useEffect(() => {
    console.log('KitComboCard product:', product);
  }, [product]);

  // Get the price: use product.price/base_price if available, otherwise sum included products
  const getCurrentPrice = () => {
    if (product.price && product.price > 0) return product.price;
    if (product.base_price && product.base_price > 0) return product.base_price;
    // Sum prices of included products if needed
    const included = product.kit_products || product.combo_products || [];
    const sum = included.reduce((total, item) => {
      const prod = item.product || item;
      const variant = item.variant || {};
      const price = variant.base_price || variant.price || prod.base_price || prod.price || 0;
      return total + Number(price);
    }, 0);
    return sum > 0 ? sum : 0;
  };
  const currentPrice = getCurrentPrice();
  const originalPrice = product.original_price || 0;
  const calculatedDiscount = originalPrice > currentPrice && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : product.discount_percent || 0;

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

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      let success = false;
      if (product.kit_products) {
        // It's a kit
        const includedVariants = product.kit_products.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }));
        const kitObj = { kit_id: product.id, ...product };
        console.log('Adding KIT to cart:', { kitObj, includedVariants, quantity: 1 });
        success = await addToCart(kitObj, includedVariants, 1);
      } else if (product.combo_products) {
        // It's a combo
        const includedVariants = product.combo_products.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }));
        const comboObj = { combo_id: product.id, ...product };
        console.log('Adding COMBO to cart:', { comboObj, includedVariants, quantity: 1 });
        success = await addToCart(comboObj, includedVariants, 1);
      } else {
        // Regular product fallback
        const itemToAdd = {
          productId: product.id,
          quantity: 1,
          price: currentPrice,
          productName: product.name,
          productImage: product.main_image_url || product.image_url || product.images?.[0] || "",
          variant: {
            id: 'default',
            price: currentPrice,
            displayText: product.kit_products ? 'Kit' : 'Combo'
          }
        }
        console.log('Adding PRODUCT to cart:', { product, variant: itemToAdd.variant, quantity: 1 });
        success = await addToCart(product, itemToAdd.variant, 1)
      }
      if (success) {
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
    setIsAddingToCart(true)
    try {
      let success = false;
      if (product.kit_products) {
        // It's a kit
        const includedVariants = product.kit_products.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }));
        const kitObj = { kit_id: product.id, ...product };
        console.log('BuyNow KIT:', { kitObj, includedVariants, quantity: 1 });
        success = await addToCart(kitObj, includedVariants, 1);
      } else if (product.combo_products) {
        // It's a combo
        const includedVariants = product.combo_products.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }));
        const comboObj = { combo_id: product.id, ...product };
        console.log('BuyNow COMBO:', { comboObj, includedVariants, quantity: 1 });
        success = await addToCart(comboObj, includedVariants, 1);
      } else {
        // Regular product fallback
        const itemToAdd = {
          productId: product.id,
          quantity: 1,
          price: currentPrice,
          productName: product.name,
          productImage: product.main_image_url || product.image_url || product.images?.[0] || "",
          variant: {
            id: 'default',
            price: currentPrice,
            displayText: product.kit_products ? 'Kit' : 'Combo'
          }
        }
        console.log('BuyNow PRODUCT:', { product, variant: itemToAdd.variant, quantity: 1 });
        success = await addToCart(product, itemToAdd.variant, 1)
      }
      if (success) {
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

          {/* Kit/Combo Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {product.kit_products ? 'KIT' : 'COMBO'}
            </span>
            {product.inventory && product.inventory <= 5 && (
              <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                Only {product.inventory} left
              </span>
            )}
          </div>

          <h2 className="product-heading text-[20px] xs:text-[22px] sm:text-[34px] lg:text-[35px] xl:text-[38px] 2xl:text-[41px] font-semibold tracking-wide">
            {product.name}
          </h2>

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm font-extralight text-black ">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={
                  i < 4 // Default to 4 stars for kits/combos
                    ? "/assets/featured/ratingstar1.svg"
                    : "/assets/featured/ratingstar2.svg"
                }
                alt="star"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            ))}
            <span className="ml-2 text-sm">| Bundle Deal</span>
          </div>

          {/* Price/Discount Section */}
          <div className="">
            <div className="flex items-center gap-2 text-[18px] xs:text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide">
              <span className="font-extralight">Price:</span>
              <span className="font-bold text-green-600">{formatPrice(currentPrice)}</span>
            </div>

            {originalPrice > currentPrice && originalPrice > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>MRP:</span>
                <span className="line-through">{formatPrice(originalPrice)}</span>
                {calculatedDiscount > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                    {calculatedDiscount}% OFF
                  </span>
                )}
              </div>
            )}

            {originalPrice > currentPrice && originalPrice > 0 && (
              <div className="text-sm text-green-600 font-medium">
                You save {formatPrice(originalPrice - currentPrice)}
              </div>
            )}
          </div>

          {/* Number of included items */}
          {includedProducts.length > 0 && (
            <div className="text-sm text-blue-700 font-medium mb-2">
              Includes {includedProducts.length} item{includedProducts.length > 1 ? 's' : ''} in this {product.kit_products ? 'kit' : 'combo'}
            </div>
          )}

          {/* Description */}
          {/* <div className="xl:flex-grow">
            <p className="text-[13px] xs:text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider whitespace-pre-line line-clamp-2 xs:line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-4 xl:line-clamp-none">
              {product.description}
            </p>
          </div> */}

          {/* Included Products & Variants */}
          {includedProducts.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold text-lg mb-4">Included Products & Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {includedProducts.map((includedProduct, idx) => {
                  const product = includedProduct.product;
                  const variant = includedProduct.variant;
                  const isMicrofiber = product?.is_microfiber === true || (typeof product?.category_name === "string" && product?.category_name?.toLowerCase()?.includes("microfiber"));
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <img
                          src={product?.main_image_url || product?.image_url || "/placeholder.svg"}
                          alt={product?.name}
                          className="w-14 h-14 object-contain rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base truncate">{product?.name}</div>
                          {/* Variant details */}
                          {isMicrofiber ? (
                            <div className="text-xs text-gray-700 mt-1">
                              <div className="flex flex-wrap gap-x-2">
                                {variant?.color && <span>Color: {variant.color}</span>}
                                {variant?.size && <span>• Size: {variant.size}</span>}
                                {variant?.gsm && <span>• GSM: {variant.gsm}</span>}
                                <span>• Qty: {includedProduct.quantity}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-700 mt-1">
                              <div className="flex flex-wrap gap-x-2">
                                {variant?.size && <span>Size: {variant.size}</span>}
                                {variant?.color && <span>• Color: {variant.color}</span>}
                                {variant?.quantity && <span>• {variant.quantity}{variant.unit || ""}</span>}
                                <span>• Qty: {includedProduct.quantity}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="mt-6">
            {isAvailable ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold text-sm">In Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-semibold text-sm">Some items out of stock</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 xl:space-y-4 relative z-10 mt-4 sm:mt-6">
            <div className="flex items-center w-full">
              <div className="border-1 border-black px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 mr-1 rounded-[4px]">
                <div className="relative w-4 h-4 xs:w-5 xs:h-5 cursor-pointer">
                  <Image src="/assets/shine.svg" alt="cart-star" fill className="object-contain" />
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !isAvailable}
                className="text-xs xs:text-sm text-black font-semibold border-1 px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="hidden xs:inline">Adding...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    Add Bundle to Cart
                    <ShoppingCart className='w-4 h-4 xs:w-5 xs:h-5' />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={!isAvailable}
              className="bg-black cursor-pointer rounded-[4px] text-white w-full px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-3 flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-800 transition-colors duration-200 text-xs xs:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Buy Bundle Now
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
