"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./AuthContext"
import CartService from "@/lib/service/cartService"
import { useRouter } from "next/navigation"
import CartDrawer from "@/components/cart/CartDrawer"

// Create the context
export const CartContext = createContext()

// Helper function to calculate all derived cart state
const calculateCartState = (cartItems, coupon) => {
  const subtotal = cartItems.reduce((total, item) => {
    const price =
      (item.combo_id && item.combo_price) ||
      (item.kit_id && item.kit_price) ||
      item.variant?.price ||
      0
    const quantity = item.quantity || 0
    // console.log(`Calculating item: ${item.product?.name || item.combo?.combo_name || item.kit?.kit_name || 'Unknown'} | Price: ${price} | Quantity: ${quantity} | Subtotal: ${total + price * quantity}`);
    return total + price * quantity
  }, 0)

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const hasComboOrKit = cartItems.some(item => item.combo_id || item.kit_id)
  let discount = 0
  if (coupon && !hasComboOrKit) {
    discount = coupon.discount || 0
  }

  const total = Math.max(0, subtotal - discount)

  return {
    cartItems,
    cartCount,
    subtotal,
    discount,
    total,
  }
}

// Create the provider component
export function CartProvider({ children }) {
  const { user, sessionChecked } = useAuth()
  const router = useRouter()
  const [cartState, setCartState] = useState({
    cartItems: [],
    cartCount: 0,
    subtotal: 0,
    discount: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Coupon state
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  // New function to allow child components to update prices
  const updateItemPrice = useCallback((itemId, prices) => {
    setCartState(prevState => {
      const updatedItems = prevState.cartItems.map(item => {
        if (item.id === itemId) {
          return { ...item, ...prices };
        }
        return item;
      });
      // Recalculate everything with the new price
      return calculateCartState(updatedItems, coupon);
    });
  }, [coupon]); // Dependency on coupon is needed because calculateCartState uses it.

  // Memoized function to update the entire cart state
  const updateCalculatedState = useCallback((items, currentCoupon) => {
    const newState = calculateCartState(items, currentCoupon)
    setCartState(newState)
  }, [])

  // Initialize or update cart
  const refreshCart = useCallback(async () => {
    // Wait until the AuthContext has finished its initial session check
    if (!sessionChecked) {
      setLoading(true);
      return;
    }

    if (!user) {
      updateCalculatedState([], null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await CartService.getCartItems(user.id)
      if (data.error) {
        console.error("Error fetching cart:", data.error)
        updateCalculatedState([], coupon)
      } else {
        updateCalculatedState(data.cartItems || [], coupon)
      }
    } catch (error) {
      console.error("Error initializing cart:", error)
      updateCalculatedState([], coupon)
    } finally {
      setLoading(false)
    }
  }, [user, sessionChecked, coupon, updateCalculatedState]);

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Re-calculate state when coupon changes
  useEffect(() => {
    updateCalculatedState(cartState.cartItems, coupon)
  }, [coupon, cartState.cartItems, updateCalculatedState])


  const addToCart = async (item, variant, quantity = 1) => {
    if (!user) {
      router.push("/login")
      return false
    }
    try {
      const result = await CartService.addToCartSmart(item, variant, quantity, user.id)
      if (result.error) {
        console.error("Database error:", result.error)
        return false
      }
      await refreshCart() // Refetch and recalculate everything
      openCart()
      return true
    } catch (error) {
      console.error("Error adding to cart:", error)
      return false
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    if (!user) {
      router.push("/login")
      return false
    }
    try {
      const result = await CartService.updateCartItem(itemId, quantity, user.id)
      if (result.error) {
        console.error("Error updating cart item:", result.error)
        return false
      }
      await refreshCart()
      return true
    } catch (error) {
      console.error("Error in updateCartItem:", error)
      return false
    }
  }

  const removeFromCart = async (itemId) => {
    if (!user) {
      router.push("/login")
      return false
    }
    try {
      const result = await CartService.removeFromCart(itemId, user.id)
      if (result.error) {
        console.error("Error removing cart item:", result.error)
        return false
      }
      await refreshCart()
      return true
    } catch (error) {
      console.error("Error in removeFromCart:", error)
      return false
    }
  }

  const clearCart = async () => {
    if (!user) {
      router.push("/login")
      return false
    }
    try {
      const result = await CartService.clearCart(user.id)
      if (result.error) {
        console.error("Error clearing cart:", result.error)
        return false
      }
      await refreshCart()
      return true
    } catch (error) {
      console.error("Error in clearCart:", error)
      return false
    }
  }

  const applyCoupon = async (code) => {
    setCouponLoading(true);
    setCouponError("");
    try {
      if (!code) {
        setCoupon(null);
        setCouponLoading(false);
        return;
      }

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: code,
          userId: user.id,
          orderAmount: cartState.subtotal
        }),
      });

      const result = await response.json();
      if (result.error) {
        setCouponError(result.error);
        setCoupon(null);
      } else {
        // Store both coupon and discount value
        setCoupon({ ...result.coupon, discount: result.discount });
      }
    } catch (err) {
      setCouponError("Failed to apply coupon.");
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponError("");
  };

  const value = {
    ...cartState,
    loading: !sessionChecked ? true : loading,
    isCartOpen,
    openCart,
    closeCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    coupon,
    couponError,
    couponLoading,
    applyCoupon,
    clearCoupon,
    updateItemPrice,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  )
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
