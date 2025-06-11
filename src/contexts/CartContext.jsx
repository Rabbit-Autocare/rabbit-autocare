"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import CartService from '@/lib/service/cartService'
import { useRouter } from 'next/navigation'

// Create the context
export const CartContext = createContext()

// Create the provider component
export function CartProvider({ children }) {
  const { user } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Function to open the cart drawer
  const openCart = () => setIsCartOpen(true)
  // Function to close the cart drawer
  const closeCart = () => setIsCartOpen(false)

  // Initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true)
        if (user) {
          // Fetch cart from database for logged-in users using CartService
          const data = await CartService.getCartItems(user.id)

          if (data.error) {
            console.error('Database error:', data.error)
            setCartItems([])
            setCartCount(0)
          } else {
            setCartItems(data.cartItems || [])
            setCartCount(data.cartItems?.length || 0)
          }
        } else {
          // If not logged in, cart should be empty
          setCartItems([])
          setCartCount(0)
        }
      } catch (error) {
        console.error('Error initializing cart:', error)
        setCartItems([])
        setCartCount(0)
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    initializeCart()
  }, [user])

  const addToCart = async (product, variant, quantity = 1) => {
    if (!user) {
      router.push('/login')
      return false
    }

    try {
      // Add to database for logged-in users using CartService
      const result = await CartService.addToCart(product.id, variant, quantity, user.id)

      if (result.error) {
        console.error('Database error:', result.error)
        return false
      }

      // Update local state by refetching cart items after successful DB update
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])
        setCartCount(updatedCartItems.cartItems?.length || 0)
      }

      openCart()
      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    if (!user) return false

    try {
      // Update in database for logged-in users using CartService
      const result = await CartService.updateCartItem(itemId, quantity, user.id)

      if (result.error) {
        console.error('Database error:', result.error)
        return false
      }

      // Update local state by refetching cart items after successful DB update
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])
        setCartCount(updatedCartItems.cartItems?.length || 0)
      }
      return true
    } catch (error) {
      console.error('Error updating cart item:', error)
      return false
    }
  }

  const removeFromCart = async (itemId) => {
    if (!user) return false

    try {
      // Remove from database for logged-in users using CartService
      const result = await CartService.removeFromCart(itemId, user.id)

      if (result.error) {
        console.error('Database error:', result.error)
        return false
      }

      // Update local state by refetching cart items after successful DB update
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])
        setCartCount(updatedCartItems.cartItems?.length || 0)
      }
      return true
    } catch (error) {
      console.error('Error removing from cart:', error)
      return false
    }
  }

  const clearCart = async () => {
    if (!user) return false

    try {
      // Clear database cart for logged-in users using CartService
      const result = await CartService.clearCart(user.id)

      if (result.error) {
        console.error('Database error:', result.error)
        return false
      }

      // Clear local state
      setCartItems([])
      setCartCount(0)

      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }

  const value = {
    cartItems,
    loading,
    mounted,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
    cartCount
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Export the hook
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
