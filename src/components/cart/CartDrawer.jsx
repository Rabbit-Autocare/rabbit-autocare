"use client"

import { useState, useEffect } from "react"
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import cartService from "@/lib/service/cartService"
import Image from "next/image"
import Link from "next/link"

export default function CartDrawer() {
  const { isOpen, closeCart } = useCart()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalPrice: 0,
    itemCount: 0
  })

  // Fetch cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true)
        const items = await cartService.getCartItems()
        setCartItems(items)

        // Get cart summary
        const cartSummary = await cartService.getCartSummary()
        setSummary(cartSummary)
      } catch (error) {
        console.error("Error fetching cart items:", error)
        setError("Failed to load cart items")
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchCartItems()
    }
  }, [isOpen])

  // Handle quantity update
  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) return

      const updatedItem = await cartService.updateCartItem(itemId, newQuantity)
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )

      // Update summary
      const cartSummary = await cartService.getCartSummary()
      setSummary(cartSummary)
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  // Handle item removal
  const handleRemoveItem = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId)
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))

      // Update summary
      const cartSummary = await cartService.getCartSummary()
      setSummary(cartSummary)
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get variant display text
  const getVariantDisplayText = (variant) => {
    if (!variant) return "Default"

    // For package variants
    if (variant.is_package) {
      return `Package of ${variant.package_quantity}`
    }

    // For regular variants
    const attributes = variant.attributes || {}
    const parts = []

    // Add quantity for liquid products
    if (attributes.quantity) {
      parts.push(attributes.quantity.displayValue)
    }

    // Add GSM for microfiber products
    if (attributes.gsm) {
      parts.push(attributes.gsm.displayValue)
    }

    // Add size for microfiber products
    if (attributes.size) {
      parts.push(attributes.size.displayValue)
    }

    // Add color for microfiber products
    if (attributes.color) {
      parts.push(attributes.color.displayValue)
    }

    return parts.join(" / ") || "Default"
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Your Cart ({summary.totalItems} items)</h2>
        </div>
        <button
          onClick={closeCart}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Your cart is empty</p>
            <Link
              href="/shop"
              className="mt-4 inline-block px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.product?.main_image_url || "/placeholder.svg"}
                    alt={item.product?.name || "Product"}
                    fill
                    className="object-cover rounded"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{item.product?.name}</h3>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Variant Info */}
                  <p className="text-sm text-gray-500 mt-1">
                    {getVariantDisplayText(item.variant)}
                  </p>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-medium">
                      {formatPrice(item.variant?.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && cartItems.length > 0 && (
        <div className="border-t p-4">
          <div className="flex justify-between mb-4">
            <span>Total Items:</span>
            <span>{summary.totalItems}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Total Price:</span>
            <span className="font-semibold">{formatPrice(summary.totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full py-3 bg-black text-white text-center rounded hover:bg-gray-800"
          >
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  )
}
