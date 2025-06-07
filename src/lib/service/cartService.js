// services/cartService.js
import { supabase } from '@/lib/supabaseClient';

class CartService {
  // Get current user's cart items
  async getCartItems() {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            id,
            name,
            main_image_url,
            category_id,
            subcategory_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getCartItems:', error);
      return [];
    }
  }

  // Add item to cart
  async addToCart(productId, variant, quantity = 1) {
    try {
      // Create cart item object
      const cartItem = {
        product_id: productId,
        variant: variant,
        quantity: quantity,
        created_at: new Date().toISOString()
      };

      // Insert into database
      const { data, error } = await supabase
        .from('cart_items')
        .upsert([cartItem], {
          onConflict: 'product_id,variant'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      throw error;
    }
  }

  // Clear entire cart
  async clearCart() {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .neq('id', 'dummy'); // Delete all items

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      throw error;
    }
  }

  // Get cart summary (total items, total price)
  async getCartSummary() {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          variant,
          product:products(
            price
          )
        `);

      if (error) throw error;

      const summary = data.reduce(
        (acc, item) => {
          const price = item.variant?.price || item.product?.price || 0;
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
      throw error;
    }
  }
}

export default new CartService();
