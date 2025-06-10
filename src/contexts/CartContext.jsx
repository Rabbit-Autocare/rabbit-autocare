"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabaseClient'

// Create the context
export const CartContext = createContext()

// Create the provider component
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true)
        if (user) {
          // Fetch cart from database for logged-in users
          const { data, error } = await supabase
            .from('cart_items')
            .select(`
              id,
              user_id,
              product_id,
              variant,
              quantity,
              created_at,
              product:products(
                id,
                name,
                main_image_url,
                price
              )
            `)
            .eq('user_id', user.id)

          if (error) {
            console.error('Database error:', error)
            // Fallback to localStorage if database access fails
            const storedCart = localStorage.getItem('cart')
            setCartItems(storedCart ? JSON.parse(storedCart) : [])
          } else {
            setCartItems(data || [])
          }
        } else {
          // Get cart from localStorage for non-logged-in users
          const storedCart = localStorage.getItem('cart')
          setCartItems(storedCart ? JSON.parse(storedCart) : [])
        }
      } catch (error) {
        console.error('Error initializing cart:', error)
        // Fallback to empty cart on error
        setCartItems([])
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    initializeCart()
  }, [user])

  // Sync cart to localStorage when not logged in
  useEffect(() => {
    if (!user && mounted) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems))
      } catch (error) {
        console.error('Error syncing cart to localStorage:', error)
      }
    }
  }, [cartItems, user, mounted])

  const addToCart = async (product, variant, quantity = 1) => {
    try {
      const cartItem = {
        product_id: product.id,
        variant,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          main_image_url: product.main_image_url,
          price: variant?.price || product.price
        }
      }

      if (user) {
        // Add to database for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .upsert([{
            user_id: user.id,
            ...cartItem
          }])

        if (error) {
          console.error('Database error:', error)
          // Continue with local state update even if database update fails
        }
      }

      // Update local state
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(
          item => item.product_id === product.id &&
          JSON.stringify(item.variant) === JSON.stringify(variant)
        )

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex].quantity += quantity
          return updatedItems
        }

        return [...prevItems, cartItem]
      })

      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    try {
      if (user) {
        // Update in database for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)

        if (error) {
          console.error('Database error:', error)
          // Continue with local state update even if database update fails
        }
      }

      // Update local state
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )

      return true
    } catch (error) {
      console.error('Error updating cart item:', error)
      return false
    }
  }

  const removeFromCart = async (itemId) => {
    try {
      if (user) {
        // Remove from database for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)

        if (error) {
          console.error('Database error:', error)
          // Continue with local state update even if database update fails
        }
      }

      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))

      return true
    } catch (error) {
      console.error('Error removing from cart:', error)
      return false
    }
  }

  const clearCart = async () => {
    try {
      if (user) {
        // Clear database cart for logged-in users
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        if (error) {
          console.error('Database error:', error)
          // Continue with local state update even if database update fails
        }
      }

      // Clear local state
      setCartItems([])
      localStorage.removeItem('cart')

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
    clearCart
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
