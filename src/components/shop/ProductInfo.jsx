"use client"

import { useState, useEffect } from "react"
import ProductVariantSelector from "./ProductVariantSelector"
import ProductQuantitySelector from "./ProductQuantitySelector"
import Image from 'next/image'

export default function ProductInfo({ product, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)

  // For microfiber products
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedGsm, setSelectedGsm] = useState("")

  // For non-microfiber products
  const [selectedQuantity, setSelectedQuantity] = useState("")

  // Extract unique variant options
  const sizes = product.is_microfiber
    ? [...new Set(product.variants.map((v) => v.size))].filter(Boolean).map((size) => ({ label: size, value: size }))
    : []

  const colors = product.is_microfiber
    ? [...new Set(product.variants.map((v) => v.color))]
        .filter(Boolean)
        .map((color) => ({ label: color, value: color }))
    : []

  const gsms = product.is_microfiber
    ? [...new Set(product.variants.map((v) => v.gsm))]
        .filter(Boolean)
        .map((gsm) => ({ label: `${gsm} GSM`, value: gsm.toString() }))
    : []

  const quantities = !product.is_microfiber
    ? [...new Set(product.variants.map((v) => v.quantity))].filter(Boolean).map((qty) => {
        const unit = product.variants.find((v) => v.quantity === qty)?.unit || ""
        return {
          label: `${qty} ${unit}`,
          value: qty,
        }
      })
    : []

  // Find matching variant based on selections
  useEffect(() => {
    let matchedVariant = null

    if (product.is_microfiber) {
      // For microfiber products, match by size, color, and gsm
      if (selectedSize && selectedColor && selectedGsm) {
        matchedVariant =
          product.variants.find(
            (v) => v.size === selectedSize && v.color === selectedColor && v.gsm?.toString() === selectedGsm,
          ) || null
      }
    } else {
      // For non-microfiber products, match by quantity
      if (selectedQuantity) {
        matchedVariant = product.variants.find((v) => v.quantity === selectedQuantity) || null
      }
    }

    setSelectedVariant(matchedVariant)
  }, [selectedSize, selectedColor, selectedGsm, selectedQuantity, product])

  // Initialize with first variant
  useEffect(() => {
    if (product.variants.length > 0) {
      const firstVariant = product.variants[0]

      if (product.is_microfiber) {
        if (firstVariant.size) setSelectedSize(firstVariant.size)
        if (firstVariant.color) setSelectedColor(firstVariant.color)
        if (firstVariant.gsm) setSelectedGsm(firstVariant.gsm.toString())
      } else {
        if (firstVariant.quantity) setSelectedQuantity(firstVariant.quantity)
      }
    }
  }, [product])

  const handleAddToCart = () => {
    if (!selectedVariant) return

    const cartItem = {
      productId: product.product_code,
      variantId: product.is_microfiber ? `${selectedSize}-${selectedColor}-${selectedGsm}` : selectedQuantity,
      quantity: quantity,
      price: selectedVariant.price,
      size: product.is_microfiber ? selectedSize : undefined,
      color: product.is_microfiber ? selectedColor : undefined,
      gsm: product.is_microfiber ? selectedGsm : undefined,
      quantityVariant: !product.is_microfiber ? selectedQuantity : undefined,
    }

    onAddToCart(cartItem)
  }

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="w-full md:w-[585px] lg:w-[685px] xl:w-1/2 space-y-2 lg:space-y-2 xl:space-y-5">
      {/* Product Title */}
      <h2 className="product-heading text-[28px] sm:text-[36px] lg:text-[40px] xl:text-[48px] font-semibold tracking-wide">
        {product.name}
      </h2>

      <p className="text-sm text-gray-500 mt-1">Product Code: {product.product_code}</p>

      {/* Star Rating */}
      {product.averageRating !== undefined && (
        <div className="flex items-center gap-1 text-[12px] md:text-sm xl:text-[12px] font-extralight text-black">
          {[...Array(5)].map((_, i) => (
            <img
              key={i}
              src={
                i < Math.floor(product.averageRating || 4)
                  ? '/assets/featured/ratingstar1.svg'
                  : '/assets/featured/ratingstar2.svg'
              }
              alt="star"
              className="w-4 h-4"
            />
          ))}
          <span className="ml-1">| {product.totalRatings || 12} Ratings</span>
        </div>
      )}

      {/* Price */}
      <p className="text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide">
        {selectedVariant ? (
          <>
            <span className='font-extralight'>MRP:</span> {formatPrice(selectedVariant.price)}
            {selectedVariant.compareAtPrice && (
              <span className="text-gray-400 line-through ml-2 text-base">
                {formatPrice(selectedVariant.compareAtPrice)}
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-500"><span className='font-extralight'>MRP:</span> Select options</span>
        )}
      </p>

      {/* Product Description */}
      <p
        className="
          text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider
          whitespace-pre-line
          line-clamp-4 sm:line-clamp-4 md:line-clamp-4 lg:line-clamp-4
          xl:line-clamp-none
        "
      >
        {product.description}
      </p>

      {/* Variant Selectors */}
      <div className="space-y-4 pt-4">
        {product.is_microfiber ? (
          <>
            {gsms.length > 0 && (
              <ProductVariantSelector
                variantType="GSM"
                options={gsms}
                selectedValue={selectedGsm}
                onChange={setSelectedGsm}
              />
            )}

            {sizes.length > 0 && (
              <ProductVariantSelector
                variantType="Size"
                options={sizes}
                selectedValue={selectedSize}
                onChange={setSelectedSize}
              />
            )}

            {colors.length > 0 && (
              <ProductVariantSelector
                variantType="Color"
                options={colors}
                selectedValue={selectedColor}
                onChange={setSelectedColor}
              />
            )}
          </>
        ) : (
          <>
            {quantities.length > 0 && (
              <ProductVariantSelector
                variantType="Choose Quantity"
                options={quantities}
                selectedValue={selectedQuantity}
                onChange={setSelectedQuantity}
              />
            )}
          </>
        )}

        {/* Quantity selector */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-medium text-sm">Quantity</span>
          <ProductQuantitySelector
            initialQuantity={1}
            maxQuantity={selectedVariant?.stock || 10}
            onQuantityChange={setQuantity}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 lg:space-y-4 pt-4">
        <div className="flex items-center w-full">
          <div className="border-1 border-black px-4 py-2 mr-1 rounded-[4px] xl:block hidden">
            <div className="relative w-full h-full">
              <Image
                src="/assets/featured/cartstar.svg"
                alt="cart-star"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className="text-sm text-black font-semibold border-1 px-4 py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
            <div className="relative w-5 h-5 xl:hidden">
              <Image
                src="/assets/featured/cartstar.svg"
                alt="cart-star"
                fill
                className="object-cover"
              />
            </div>
          </button>
        </div>

        <button className="bg-black cursor-pointer rounded-[4px] text-white w-full px-4 py-3 flex items-center justify-center gap-2">
          Buy Now
          <div className="relative w-5 h-5">
            <Image
              src="/assets/featured/buynowsvg.svg"
              alt="buy-now"
              fill
              className="object-cover"
            />
          </div>
        </button>
      </div>
    </div>
  )
}
