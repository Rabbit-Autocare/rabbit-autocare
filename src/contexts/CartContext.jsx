"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import cartService from '@/lib/service/cartService'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true)
        const items = await cartService.getCartItems()
        setCartItems(items)

        // Get cart summary for count
        const summary = await cartService.getCartSummary()
        setCartCount(summary.totalItems)
      } catch (error) {
        console.error('Error initializing cart:', error)
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    initializeCart()
  }, [])

  // Add item to cart
  const addToCart = async (productId, variant, quantity = 1) => {
    try {
      const newItem = await cartService.addToCart(productId, variant, quantity)

      // Update cart items
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item =>
          item.product_id === productId &&
          JSON.stringify(item.variant) === JSON.stringify(variant)
        )

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity
          }
          return updatedItems
        }

        return [...prevItems, newItem]
      })

      // Update cart count
      const summary = await cartService.getCartSummary()
      setCartCount(summary.totalItems)

      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  // Update cart item quantity
  const updateCartItem = async (itemId, quantity) => {
    try {
      await cartService.updateCartItem(itemId, quantity)

      // Update cart items
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )

      // Update cart count
      const summary = await cartService.getCartSummary()
      setCartCount(summary.totalItems)

      return true
    } catch (error) {
      console.error('Error updating cart item:', error)
      return false
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId)

      // Update cart items
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))

      // Update cart count
      const summary = await cartService.getCartSummary()
      setCartCount(summary.totalItems)

      return true
    } catch (error) {
      console.error('Error removing from cart:', error)
      return false
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      await cartService.clearCart()
      setCartItems([])
      setCartCount(0)
      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }

  // Get cart summary
  const getCartSummary = async () => {
    try {
      return await cartService.getCartSummary()
    } catch (error) {
      console.error('Error getting cart summary:', error)
      return {
        totalItems: 0,
        totalPrice: 0,
        itemCount: 0
      }
    }
  }

  const value = {
    isOpen,
    setIsOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    cartItems,
    cartCount,
    loading,
    mounted,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
