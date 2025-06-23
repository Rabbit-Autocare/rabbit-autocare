"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import CartService from "@/lib/service/cartService"
import { useRouter } from "next/navigation"
import CartDrawer from "@/components/cart/CartDrawer" // Import CartDrawer

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
  // Coupon state and logic
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

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
          const data = await CartService.getCartItems(user.id)
          if (data.error) {
            console.error("Error fetching cart:", data.error)
            setCartItems([])
            setCartCount(0)
          } else {
            setCartItems(data.cartItems || [])

            // Calculate total items count (sum of all quantities)
            const totalItemsCount = (data.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0)

            setCartCount(totalItemsCount)
          }
        } else {
          // If not logged in, cart should be empty
          setCartItems([])
          setCartCount(0)
        }
      } catch (error) {
        console.error("Error initializing cart:", error)
        setCartItems([])
        setCartCount(0)
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    initializeCart()
  }, [user])

  const addToCart = async (productOrComboOrKit, variant, quantity = 1) => {
    if (!user) {
      router.push("/login")
      return false
    }

    try {
      let result;
      // Edge case handling: pass correct object for combos/kits/products
      if (productOrComboOrKit && productOrComboOrKit.combo_id) {
        // Combo
        console.log("CartContext: Adding combo to cart", productOrComboOrKit, variant, quantity);
        result = await CartService.addToCartSmart(productOrComboOrKit, variant, quantity, user.id);
      } else if (productOrComboOrKit && productOrComboOrKit.kit_id) {
        // Kit
        console.log("CartContext: Adding kit to cart", productOrComboOrKit, variant, quantity);
        result = await CartService.addToCartSmart(productOrComboOrKit, variant, quantity, user.id);
      } else if (productOrComboOrKit && productOrComboOrKit.id) {
        // Product
        console.log("CartContext: Adding product to cart", productOrComboOrKit, variant, quantity);
        result = await CartService.addToCartSmart(productOrComboOrKit, variant, quantity, user.id);
      } else {
        // Fallback: try to pass as product id (legacy)
        console.warn("CartContext: Unknown addToCart type, passing as id", productOrComboOrKit, variant, quantity);
        result = await CartService.addToCartSmart(productOrComboOrKit, variant, quantity, user.id);
      }

      if (result.error) {
        console.error("Database error:", result.error)
        return false
      }

      // Update local state by refetching cart items
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])
        // Calculate total items count (sum of all quantities)
        const totalItemsCount = (updatedCartItems.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0)
        setCartCount(totalItemsCount)
      }

      openCart()
      return true
    } catch (error) {
      console.error("Error adding to cart:", error)
      return false
    }
  }

  // Improve the updateCartItem function to refresh cart after update
  const updateCartItem = async (itemId, quantity) => {
    if (!user) {
      router.push("/login")
      return false
    }

    try {
      console.log("Updating cart item in context:", { itemId, quantity })

      // Use the CartService to update quantity
      const result = await CartService.updateCartItem(itemId, quantity, user.id)

      if (result.error) {
        console.error("Error updating cart item:", result.error)
        return false
      }

      // Refresh cart items after successful update
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])

        // Calculate total items count (sum of all quantities)
        const totalItemsCount = (updatedCartItems.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0)

        setCartCount(totalItemsCount)
      }

      return true
    } catch (error) {
      console.error("Error in updateCartItem:", error)
      return false
    }
  }

  // Also update the removeFromCart function similarly
  const removeFromCart = async (itemId) => {
    if (!user) {
      router.push("/login")
      return false
    }

    try {
      console.log("Removing cart item in context:", itemId)

      // Use the CartService to remove item
      const result = await CartService.removeFromCart(itemId, user.id)

      if (result.error) {
        console.error("Error removing cart item:", result.error)
        return false
      }

      // Refresh cart items after successful removal
      const updatedCartItems = await CartService.getCartItems(user.id)
      if (!updatedCartItems.error) {
        setCartItems(updatedCartItems.cartItems || [])

        // Calculate total items count (sum of all quantities)
        const totalItemsCount = (updatedCartItems.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0)

        setCartCount(totalItemsCount)
      }

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

      // Reset cart items and count
      setCartItems([])
      setCartCount(0)
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

      // Calculate cart subtotal for coupon validation
      const subtotal = cartItems.reduce((total, item) => {
        const price = (item.combo_id && item.combo_price)
          ? item.combo_price
          : (item.kit_id && item.kit_price)
          ? item.kit_price
          : item.variant?.price || 0;
        return total + price * item.quantity;
      }, 0);

      console.log('Applying coupon:', { code, userId: user.id, subtotal, cartItems });

      // Call the coupon validation API
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: code,
          userId: user.id,
          orderAmount: subtotal
        }),
      });

      const result = await response.json();
      console.log('Coupon validation result:', result);

      if (!response.ok) {
        setCouponError(result.error || "Invalid coupon code");
        setCoupon(null);
        return;
      }

      if (result.success) {
        const couponData = {
          code: result.coupon.code,
          type: "percentage",
          value: result.coupon.discount_percent,
          applicable_upto: 0, // This will be handled by the backend validation
          description: result.coupon.description || `${result.coupon.discount_percent}% off`,
          discount: result.discount
        };
        console.log('Setting coupon data:', couponData);
        setCoupon(couponData);
      } else {
        setCouponError(result.error || "Invalid coupon code");
        setCoupon(null);
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponError("Failed to apply coupon. Please try again.");
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
    cartCount,
    coupon,
    applyCoupon,
    clearCoupon,
    couponLoading,
    couponError,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Render CartDrawer at root level - independent of navbar positioning */}
      <CartDrawer />
    </CartContext.Provider>
  )
}

// Export the hook
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
