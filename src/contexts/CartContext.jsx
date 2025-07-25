'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import CartService from '@/lib/service/cartService';
import { ComboService } from '@/lib/service/comboService';
import { ClientUserService } from '@/lib/service/client-userService';
import { useRouter } from 'next/navigation';
import CartDrawer from '@/components/cart/CartDrawer';

// Create the context
export const CartContext = createContext();

const GST_RATE = 18;

const calculateCartState = (cartItems, coupon) => {
  let subtotal = 0; // MRP (GST-incl)

  // Calculate subtotal
  cartItems.forEach((item) => {
    const qty = item.quantity || 1;
    const priceIncl = item.variant?.base_price || item.variant?.price || 0;
    subtotal += priceIncl * qty;
    console.log('[CartCalc] Item:', {
      name:
        item.product?.name ||
        item.combo?.combo_name ||
        item.kit?.kit_name ||
        'Unknown',
      base_price: priceIncl,
      quantity: qty,
    });
  });

  // Calculate discount on MRP subtotal
  let discount = 0;
  if (coupon) {
    if (coupon.percent) {
      discount = subtotal * (coupon.percent / 100);
    } else if (coupon.discount) {
      discount = coupon.discount;
    }
  }

  // Final total (MRP - discount)
  const total = subtotal - discount;
  const youSaved = discount;

  // For UI compatibility
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const hasComboOrKit = cartItems.some((item) => item.combo_id || item.kit_id);

  console.log('[CartCalc] Final:', {
    subtotal,
    discount,
    total,
    youSaved,
  });

  return {
    cartItems,
    cartCount,
    subtotal, // MRP
    discount,
    total,
    youSaved,
    hasComboOrKit,
  };
};

// Create the provider component
export function CartProvider({ children, initialCartItems = [] }) {
  // console.log(
  //   '[CartProvider] Initializing with initialCartItems:',
  //   initialCartItems
  // );
  const { user, sessionChecked } = useAuth();
  const router = useRouter();

  // Initialize state properly with calculated values
  const [cartState, setCartState] = useState(() => {
    const initialState = calculateCartState(initialCartItems, null);
    console.log('[CartProvider] Initial calculated state:', initialState);
    return initialState;
  });

  const [loading, setLoading] = useState(!sessionChecked);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Coupon state
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Combos and coupons data
  const [combos, setCombos] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [combosLoading, setCombosLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(true);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Fetch combos for frequently bought together
  const fetchCombos = useCallback(async () => {
    if (!user?.id) {
      setCombos([]);
      setCombosLoading(false);
      return;
    }

    try {
      setCombosLoading(true);
      console.log('CartContext: Fetching combos...');
      const combosData = await ComboService.getCombosForCart();
      console.log('CartContext: Combos fetched successfully:', combosData?.length || 0);
      setCombos(combosData || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      setCombos([]);
    } finally {
      setCombosLoading(false);
    }
  }, [user?.id]);

  // Fetch available coupons for the user
  const fetchAvailableCoupons = useCallback(async () => {
    if (!user?.id) {
      setAvailableCoupons([]);
      setCouponsLoading(false);
      return;
    }

    try {
      setCouponsLoading(true);
      const result = await ClientUserService.getUserCoupons(user.id);
      if (result.success) {
        setAvailableCoupons(result.data.availableCoupons || []);
      } else {
        console.error('Error fetching user coupons:', result.error);
        setAvailableCoupons([]);
      }
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      setAvailableCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, [user?.id]);

  // New function to allow child components to update prices
  const updateItemPrice = useCallback(
    (itemId, prices) => {
      setCartState((prevState) => {
        const updatedItems = prevState.cartItems.map((item) => {
          if (item.id === itemId) {
            return { ...item, ...prices };
          }
          return item;
        });
        // Recalculate everything with the new price
        return calculateCartState(updatedItems, coupon);
      });
    },
    [coupon]
  ); // Dependency on coupon is needed because calculateCartState uses it.

  // Memoized function to update the entire cart state
  const updateCalculatedState = useCallback((items, currentCoupon) => {
    const newState = calculateCartState(items, currentCoupon);
    setCartState(newState);
  }, []);

  // Initialize or update cart
  const refreshCart = useCallback(async () => {
    console.log('[CartProvider] refreshCart called, sessionChecked:', sessionChecked, 'user:', !!user);

    // Wait until the AuthContext has finished its initial session check
    if (!sessionChecked) {
      setLoading(true);
      return;
    }

    // If no user, clear cart but don't set loading if we have initial data
    if (!user) {
      updateCalculatedState([], null);
      setLoading(false);
      return;
    }

    // If we have initial cart items and this is the first load, use them
    if (initialCartItems.length > 0 && cartState.cartItems.length === 0) {
      console.log('[CartProvider] Using initial cart items');
      updateCalculatedState(initialCartItems, coupon);
      setLoading(false);
      return;
    }

    // Only fetch from server if we don't have initial data or need to refresh
    setLoading(true);
    try {
      console.log('[CartProvider] Fetching cart from CartService...');
      const data = await CartService.getCartItems(user.id);
      if (data.error) {
        console.error('[CartProvider] Error fetching cart:', data.error);
        // Show user-friendly error message for cart fetch issues
        console.warn('[CartProvider] Cart fetch failed, using empty cart:', data.error);
        updateCalculatedState([], coupon);
      } else {
        updateCalculatedState(data.cartItems || [], coupon);
        // console.log('[CartProvider] Cart items after refresh:', data.cartItems);
        // If cart is empty after refresh, force loading false
        if (!data.cartItems || data.cartItems.length === 0) {
          setLoading(false);
          console.log('[CartProvider] Cart is empty after refresh, forced loading to false.');
        }
      }
    } catch (error) {
      console.error('[CartProvider] Error initializing cart:', error);
      // Show user-friendly error message
      console.warn('[CartProvider] Cart initialization failed, using empty cart:', error.message);
      updateCalculatedState([], coupon);
    } finally {
      setLoading(false);
      // console.log('[CartProvider] Cart loading complete.');
    }
  }, [
    user,
    sessionChecked,
    coupon,
    updateCalculatedState,
    initialCartItems,
    cartState.cartItems.length,
  ]);

  // Fetch combos and coupons when user changes
  useEffect(() => {
    if (sessionChecked) {
      fetchCombos();
      fetchAvailableCoupons();
    }
  }, [sessionChecked, fetchCombos, fetchAvailableCoupons]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Re-calculate state when coupon changes
  useEffect(() => {
    if (cartState.cartItems.length > 0) {
      updateCalculatedState(cartState.cartItems, coupon);
    }
  }, [coupon]); // Remove cartState.cartItems from dependencies to avoid infinite loop

  // Clear cart and reset loading if user becomes null after sessionChecked
  useEffect(() => {
    if (sessionChecked && !user) {
      setCartState({ cartItems: [], cartCount: 0, subtotal: 0, discount: 0, total: 0, youSaved: 0, hasComboOrKit: false });
      setLoading(false);
      console.log('[CartContext] Cleared cart because user is null after sessionChecked.');
    }
  }, [sessionChecked, user]);

  useEffect(() => {
    console.log('[CartContext] loading:', loading, 'user:', user, 'sessionChecked:', sessionChecked);
  }, [loading, user, sessionChecked]);

  const addToCart = async (item, variant, quantity = 1) => {
    if (!user) {
      router.push('/login');
      return false;
    }
    try {
      const result = await CartService.addToCartSmart(
        item,
        variant,
        quantity,
        user.id
      );
      if (result.success) {
        await refreshCart(); // Refetch and recalculate everything
        openCart();
        return true;
      } else {
        console.error('Failed to add to cart:', result.error);
        alert(`Failed to add item to cart: ${result.error || 'Please try again'}`);
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Error adding to cart: ${error.message || 'Please try again'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    if (!user) {
      router.push('/login');
      return false;
    }
    try {
      const result = await CartService.updateCartItem(
        itemId,
        quantity,
        user.id
      );
      if (result.error) {
        console.error('Error updating cart item:', result.error);
        return false;
      }
      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) {
      router.push('/login');
      return false;
    }
    try {
      const result = await CartService.removeFromCart(itemId, user.id);
      if (result.error) {
        console.error('Error removing cart item:', result.error);
        return false;
      }
      await refreshCart();
      console.log('[CartProvider] removeFromCart: called refreshCart after removal.');
      return true;
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      return false;
    } finally {
      setLoading(false); // Safety net: always set loading to false
      console.log('[CartProvider] removeFromCart: setLoading(false) called.');
    }
  };

  const clearCart = async () => {
    if (!user) {
      router.push('/login');
      return false;
    }
    try {
      const result = await CartService.clearCart(user.id);
      if (result.error) {
        console.error('Error clearing cart:', result.error);
        return false;
      }
      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      return false;
    } finally {
      setLoading(false); // Safety net: always set loading to false
    }
  };

  const applyCoupon = async (code) => {
    setCouponLoading(true);
    setCouponError('');
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
          orderAmount: cartState.subtotal,
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
      setCouponError('Failed to apply coupon.');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponError('');
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
    combos,
    availableCoupons,
    combosLoading,
    couponsLoading,
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img
            src='/assets/loader.gif'
            alt='Loading...'
            className='h-48 w-48 mx-auto mb-4'
          />
        </div>
      </div>
    );
  }

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
