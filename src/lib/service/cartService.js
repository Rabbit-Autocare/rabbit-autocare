// services/cartService.js
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
// If you have a server-side client, import and use it here instead
const supabase = createSupabaseBrowserClient(); // Make sure this is NOT inside the method

class CartService {
  // Get current user's cart items
  async getCartItems(userId) {
    if (!userId) return { cartItems: [] };
    const supabase = createSupabaseBrowserClient();

    try {
      // Increase timeout to 30 seconds for better reliability
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cart fetch timeout - please try again')), 30000)
      );
      const cartPromise = supabase
        .from('cart_items')
        .select(
          `
            *,
            product:products(
              id,
              name,
              main_image_url,
              product_code,
              images
            )
          `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      const { data, error } = await Promise.race([cartPromise, timeoutPromise]);
      if (error) return { cartItems: [], error: error.message };
      return { cartItems: data || [] };
    } catch (error) {
      console.error('[getCartItems] Error:', error);
      return { cartItems: [], error: error.message || 'Failed to fetch cart items' };
    }
  }

  // New method to find existing cart item with same product and variant
  async findExistingCartItem(productId, variant, userId) {
    console.log('findExistingCartItem: Searching for existing item', { productId, variant, userId });
    const supabase = createSupabaseBrowserClient();
    try {
      // Query cart_items where user_id = userId AND product_id = productId
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('findExistingCartItem: No items found for product ID', productId);
        return null;
      }

      // Filter results to find matching variant
      const existingItem = data.find((item) => {
        // Normalize variants for comparison
        const normalizeVariant = (v) => {
          if (!v) return null;
          const normalized = {};
          if (v.id) normalized.id = v.id;
          if (v.size) normalized.size = v.size;
          if (v.color) normalized.color = v.color;
          if (v.quantity_value) normalized.quantity_value = v.quantity_value; // Assuming 'quantity_value' is the numeric part of quantity
          if (v.unit) normalized.unit = v.unit;
          if (v.gsm) normalized.gsm = v.gsm;
          if (v.is_package !== undefined) normalized.is_package = v.is_package;
          if (v.package_quantity) normalized.package_quantity = v.package_quantity;
          // Add other relevant variant attributes here
          return normalized;
        };

        const normalizedItemVariant = normalizeVariant(item.variant);
        const normalizedSearchVariant = normalizeVariant(variant);

        const areVariantsEqual = JSON.stringify(normalizedItemVariant) === JSON.stringify(normalizedSearchVariant);

        console.log('findExistingCartItem: Comparing variants:', {
          itemVariant: item.variant,
          searchVariant: variant,
          normalizedItemVariant,
          normalizedSearchVariant,
          areVariantsEqual
        });

        return areVariantsEqual;
      });

      console.log('findExistingCartItem: Existing item found:', existingItem);
      return existingItem || null;
    } catch (error) {
      console.error('Error in findExistingCartItem:', error);
      return null;
    }
  }

  // Smart add method that handles duplicates
  async addToCartSmart(productOrComboOrKit, variant, quantity = 1, userId) {
    console.log('addToCartSmart input:', productOrComboOrKit, variant, quantity, userId);

    return fetchWithRetry(async () => {
      const supabase = createSupabaseBrowserClient();

      try {
        let isCombo = false;
        let isKit = false;
        let comboId = null;
        let kitId = null;
        let productId = null;
        let variantToStore = null;

        if (productOrComboOrKit && productOrComboOrKit.combo_id) {
          isCombo = true;
          comboId = productOrComboOrKit.combo_id; // always use UUID
          // For combos, ensure variant is an array of full variant objects
          variantToStore = Array.isArray(variant) ? variant.map(v => ({ ...v })) : [];
        } else if (productOrComboOrKit && productOrComboOrKit.kit_id) {
          isKit = true;
          kitId = productOrComboOrKit.kit_id; // always use UUID
          // For kits, ensure variant is an array of full variant objects
          variantToStore = Array.isArray(variant) ? variant.map(v => ({ ...v })) : [];
        } else if (productOrComboOrKit && productOrComboOrKit.id) {
          productId = productOrComboOrKit.id; // integer for products
          // For single products, ensure variant is a full object
          variantToStore = { ...variant };
        } else {
          throw new Error('Invalid product, combo, or kit data provided');
        }

        // Check if this item already exists in the cart
        let existingItem = null;
        if (isCombo) {
          // Only query by combo_id for combos
          const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId)
            .eq('combo_id', comboId)
            .single();
          if (!error && data) existingItem = data;
        } else if (isKit) {
          // Only query by kit_id for kits
          const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId)
            .eq('kit_id', kitId)
            .single();
          if (!error && data) existingItem = data;
        } else if (productId) {
          // Only query by product_id for products
          existingItem = await this.findExistingCartItem(productId, variantToStore, userId);
        }

        if (existingItem) {
          // Update quantity if already in cart
          const newQuantity = existingItem.quantity + quantity;
          const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existingItem.id)
            .select()
            .single();
          if (error) throw new Error(`Failed to update cart item: ${error.message}`);
          return { success: true, cartItem: data, updated: true };
        }

        // Insert new cart item
        const cartItem = {
          user_id: userId,
          product_id: productId || null, // integer or null
          variant: (productId && variantToStore) ? variantToStore : ((isCombo || isKit) ? variantToStore : null),
          quantity: quantity,
          combo_id: isCombo ? comboId : null, // uuid or null
          kit_id: isKit ? kitId : null,       // uuid or null
          created_at: new Date().toISOString(),
        };
        // Defensive: never allow product_id to be a string/uuid
        if (cartItem.product_id && typeof cartItem.product_id !== 'number') {
          console.warn('cartService.js - product_id is not a number, setting to null:', cartItem.product_id);
          cartItem.product_id = null;
        }
        console.log('cartService.js - cartItem to insert:', cartItem);
        const { data, error } = await supabase
          .from('cart_items')
          .insert([cartItem])
          .select()
          .single();
        if (error) throw new Error(`Failed to add item to cart: ${error.message}`);
        return { success: true, cartItem: data, created: true };
      } catch (error) {
        console.error('addToCartSmart error:', error);
        throw new Error(error.message || 'Failed to add item to cart');
      }
    }, 2, 500); // Retry 2 times with 500ms base delay
  }

  // Add item to cart
  async addToCart(productOrComboOrKit, variant, quantity = 1, userId) {
    return this.addToCartSmart(productOrComboOrKit, variant, quantity, userId);
  }

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity, userId) {
    const supabase = createSupabaseBrowserClient();
    try {
      console.log('Updating cart item:', { cartItemId, quantity, userId });

      // If quantity is zero, remove the item instead
      if (quantity <= 0) {
        return this.removeFromCart(cartItemId, userId);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity: quantity, // Make sure we're using the exact quantity passed in
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating cart quantity in database:', error);
        throw error;
      }

      console.log('Cart item updated successfully:', data);
      return { success: true, cartItem: data };
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      return { error: error.message };
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId, userId) {
    const supabase = createSupabaseBrowserClient();
    try {
      console.log('Removing cart item:', { cartItemId, userId });

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', userId);

      if (error) throw error;
      console.log('Cart item removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      return { error: error.message };
    }
  }

  // Clear entire cart
  async clearCart(userId) {
    const supabase = createSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error in clearCart:', error);
      return { error: error.message };
    }
  }

  // Get cart summary (total items, total price)
  async getCartSummary(userId) {
    const supabase = createSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(
          `
          quantity,
          variant,
          product:products(
            id,
            name,
            product_code,
            is_microfiber
          )
        `
        )
        .eq('user_id', userId);

      if (error) throw error;

      const summary = data.reduce(
        (acc, item) => {
          const price = item.variant?.price || 0;
          acc.totalItems += item.quantity;
          acc.totalPrice += price * item.quantity;
          acc.itemCount += 1;
          return acc;
        },
        { totalItems: 0, totalPrice: 0, itemCount: 0 }
      );

      return summary;
    } catch (error) {
      console.error('Error in getCartSummary:', error);
      return { error: error.message };
    }
  }
}

const cartService = new CartService();
export default cartService;

// Server-side fetch for SSR
export async function fetchCartItems(userId) {
  if (!userId) return [];
  const supabase = createSupabaseBrowserClient(); // Replace with server client if available
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(id, name, main_image_url, product_code, images)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[fetchCartItems] Error:', error);
    return [];
  }
  // console.log('[fetchCartItems] data:', data);
  return data || [];
}
