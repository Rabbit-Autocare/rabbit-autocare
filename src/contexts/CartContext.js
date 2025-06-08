'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

// Create context for cart functionality
export const CartContext = createContext();

/**
 * Provider component that wraps the application to provide cart functionality
 * Manages cart state, operations and coupon application
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function CartProvider({ children }) {
  // Cart UI state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart data state
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Coupon state
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Fetch current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);

      if (data?.user) {
        fetchCartItems(data.user.id);
      } else {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // Set up real-time subscription for cart updates
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchCartItems(user.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  /**
   * Fetches cart items for a specific user
   *
   * @param {string} userId - The user ID to fetch cart items for
   */
  const fetchCartItems = async (userId) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Transform data to expected format
      const transformedData = data.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: item.product_id,
          name: item.name || '',
          price: item.price || 0,
        },
      }));

      setCartItems(transformedData);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adds a product to the cart
   *
   * @param {string} productId - The ID of the product to add
   * @param {number} quantity - The quantity to add (defaults to 1)
   */
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert('Please sign in to add items to your cart');
      return;
    }

    try {
      // Check if the item is already in the cart
      const existingItem = cartItems.find(
        (item) => item.product_id === productId
      );

      if (existingItem) {
        // Update existing item quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        // Add new item
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });
      }

      // Open cart drawer when item is added
      openCart();

      // Refetch cart items
      fetchCartItems(user.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  /**
   * Removes an item from the cart
   *
   * @param {string} itemId - The ID of the cart item to remove
   */
  const removeFromCart = async (itemId) => {
    if (!user) return;

    try {
      await supabase.from('cart_items').delete().eq('id', itemId);
      fetchCartItems(user.id);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  /**
   * Updates the quantity of a cart item
   *
   * @param {string} itemId - The ID of the cart item to update
   * @param {number} quantity - The new quantity value
   */
  const updateQuantity = async (itemId, quantity) => {
    if (!user) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);

        if (error) {
          console.error('Error updating quantity:', error);
          return;
        }

        // Refresh the cart items after update
        await fetchCartItems(user.id);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  /**
   * Clears all items from the user's cart
   */
  const clearCart = async () => {
    if (!user) return;

    try {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  /**
   * Applies a coupon code to the current order
   * Validates if the coupon is active, not expired, and minimum order amount is met
   *
   * @param {string} code - The coupon code to apply
   */
  const applyCoupon = async (code) => {
    if (!code) {
      setCoupon(null);
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      // First check if the coupon exists and is active
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponError) {
        setCouponError('Invalid coupon code');
        setCoupon(null);
        return;
      }

      // Check if user has already used this coupon
      const { data: userCoupon, error: userCouponError } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('coupon_id', couponData.id);

      if (userCoupon && userCoupon.length > 0) {
        setCouponError('You have already used this coupon');
        setCoupon(null);
        return;
      }

      // Check if coupon is expired
      if (!couponData.is_permanent && new Date(couponData.expiry_date) < new Date()) {
        setCouponError('This coupon has expired');
        setCoupon(null);
        return;
      }

      // Check minimum order requirement
      const subtotal = calculateSubtotal();
      if (subtotal < couponData.min_order_amount) {
        setCouponError(`Minimum order of ₹${couponData.min_order_amount} required`);
        setCoupon(null);
        return;
      }

      setCoupon(couponData);
      
      // Save to localStorage
      localStorage.setItem("appliedCoupon", JSON.stringify(couponData));
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Error applying coupon');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  /**
   * Calculates the subtotal of all items in cart
   *
   * @returns {number} The subtotal amount
   */
  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  /**
   * Calculates discount amount based on applied coupon
   *
   * @returns {number} The discount amount
   */
  const calculateDiscount = () => {
    if (!coupon) return 0;

    const subtotal = calculateSubtotal();
    return Math.round((subtotal * coupon.discount_percent) / 100);
  };

  /**
   * Calculates final total after applying discounts
   *
   * @returns {number} The final total
   */
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  // Monitor cart changes to validate minimum order requirement
  useEffect(() => {
    // Skip if no coupon is applied or no user
    if (!coupon || !user) return;

    // Validate coupon minimum order value whenever cart items change
    const subtotal = calculateSubtotal();
    if (subtotal < coupon.min_order_amount) {
      // Remove invalid coupon
      setCoupon(null);
      setCouponError(
        `Coupon removed: Minimum order of ₹${coupon.min_order_amount} required to use ${coupon.code}`
      );
      
      // Also remove from localStorage
      localStorage.removeItem("appliedCoupon");
    } else {
      // Ensure coupon is saved to localStorage when valid
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    }
  }, [cartItems]);

  // Cart UI control functions
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Combine all cart functionality into a single context value
  const value = {
    isCartOpen,
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    coupon,
    couponLoading,
    couponError,
    applyCoupon,
    calculateSubtotal,
    calculateDiscount,
    calculateTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
