// services/cartService.js
import { supabase } from '@/lib/supabaseClient';

class CartService {
  // Get current user's cart items
  async getCartItems(userId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
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
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { cartItems: data || [] };
    } catch (error) {
      console.error('Error in getCartItems:', error);
      return { error: error.message, cartItems: [] };
    }
  }

  // Add item to cart
  async addToCart(productId, variant, quantity = 1, userId) {
    try {
      // Create cart item object
      const cartItem = {
        user_id: userId,
        product_id: productId,
        variant: variant,
        quantity: quantity,
        created_at: new Date().toISOString()
      };

      // Insert into database
      const { data, error } = await supabase
        .from('cart_items')
        .upsert([cartItem])
        .select()
        .single();

      if (error) throw error;
      return { success: true, cartItem: data };
    } catch (error) {
      console.error('Error in addToCart:', error);
      return { error: error.message };
    }
  }

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity, userId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, cartItem: data };
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      return { error: error.message };
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId, userId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', userId);

      if (error) throw error;
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
        .select(`
          quantity,
          variant,
          product:products(
            id,
            name,
            product_code,
            is_microfiber
          )
        `)
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
