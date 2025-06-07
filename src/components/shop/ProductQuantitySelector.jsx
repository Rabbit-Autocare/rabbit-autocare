"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"

export default function ProductQuantitySelector({ initialQuantity = 1, maxQuantity = 99, onQuantityChange }) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const increment = () => {
    if (quantity < maxQuantity) {
      const newQuantity = quantity + 1
      setQuantity(newQuantity)
      onQuantityChange(newQuantity)
    }
  }

  const decrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onQuantityChange(newQuantity)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={decrement}
        disabled={quantity <= 1}
        className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>

      <span className="w-10 text-center font-medium">{quantity}</span>

      <button
        onClick={increment}
        disabled={quantity >= maxQuantity}
        className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
