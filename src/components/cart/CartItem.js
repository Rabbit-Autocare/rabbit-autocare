"use client"

import { useState } from "react"
import { useCart } from "@/contexts/CartContext"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = async (newQuantity) => {
    setIsUpdating(true)
    try {
      updateQuantity(item.id, newQuantity)
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = () => {
    removeFromCart(item.id)
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
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-white">
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
        {item.productImage ? (
          <Image
            src={item.productImage || "/placeholder.svg"}
            alt={item.productName}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{item.productName}</h4>
        {item.variant && item.variant !== "default" && (
          <p className="text-xs text-gray-500 mt-1">Variant: {item.variant}</p>
        )}
        <p className="text-sm font-semibold text-gray-900 mt-1">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-3 h-3" />
        </button>

        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
