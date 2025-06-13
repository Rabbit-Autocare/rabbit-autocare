// services/cartService.js
import { supabase } from '@/lib/supabaseClient';

class CartService {
  // Get current user's cart items
  async getCartItems(userId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(
            id,
            name,
            main_image_url,
            product_code,
            is_microfiber,
            key_features,
            taglines,
            images
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { cartItems: data || [] };
    } catch (error) {
      console.error('Error in getCartItems:', error);
      return { error: error.message, cartItems: [] };
    }
  }

  // New method to find existing cart item with same product and variant
  async findExistingCartItem(productId, variant, userId) {
    try {
      // Query cart_items where user_id = userId AND product_id = productId
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      // Filter results to find matching variant
      const existingItem = data.find((item) => {
        // Strategy 1: If variant has ID, compare by ID
        if (variant.id && item.variant?.id) {
          return item.variant.id === variant.id;
        }

        // Strategy 2: Compare key properties for microfiber products
        if (variant.size && variant.color) {
          return (
            item.variant?.size === variant.size &&
            item.variant?.color === variant.color
          );
        }

        // Strategy 3: Compare key properties for liquid products
        if (variant.quantity && variant.unit) {
          return (
            item.variant?.quantity === variant.quantity &&
            item.variant?.unit === variant.unit
          );
        }

        // Fallback: Compare stringified JSON (less reliable)
        return JSON.stringify(item.variant) === JSON.stringify(variant);
      });

      return existingItem || null;
    } catch (error) {
      console.error('Error in findExistingCartItem:', error);
      return null;
    }
  }

  // Smart add method that handles duplicates
  async addToCartSmart(productId, variant, quantity = 1, userId) {
    try {
      // Step 1: Check if item exists
      const existingItem = await this.findExistingCartItem(
        productId,
        variant,
        userId
      );

      if (existingItem) {
        // Step 2a: If exists, update quantity
        const newQuantity = existingItem.quantity + quantity;

        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, cartItem: data, updated: true };
      } else {
        // Step 2b: If not exists, create new cart item
        const cartItem = {
          user_id: userId,
          product_id: productId,
          variant: variant,
          quantity: quantity,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('cart_items')
          .insert([cartItem])
          .select()
          .single();

        if (error) throw error;
        return { success: true, cartItem: data, created: true };
      }
    } catch (error) {
      console.error('Error in addToCartSmart:', error);
      return { error: error.message };
    }
  }

  // Add item to cart
  async addToCart(productId, variant, quantity = 1, userId) {
    return this.addToCartSmart(productId, variant, quantity, userId);
  }

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity, userId) {
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

export default new CartService();
