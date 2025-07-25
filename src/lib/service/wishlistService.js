// lib/service/wishlistService.js
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const supabase = createSupabaseBrowserClient();

export class WishlistService {
  // Get current user's wishlist items
  static async getWishlist() {
    console.log('🔄 WishlistService: Making API call to /api/wishlist');

    const res = await fetch('/api/wishlist', {
      credentials: 'include' // Include cookies for authentication
    });

    console.log('📡 API Response status:', res.status);

    const result = await res.json();
    console.log('📋 API Response data:', result);

    if (!result.success) {
      console.error('❌ API Error:', result.error);
      throw new Error(result.error || 'Failed to fetch wishlist');
    }

    return { data: result.data };
  }

  // Find existing wishlist item with same product and variant
  static async findExistingWishlistItem(productId, variant, userId) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Compare variants
    const normalizeVariant = (v) => {
      if (!v) return null;
      const normalized = {};
      if (v.id) normalized.id = v.id;
      if (v.size) normalized.size = v.size;
      if (v.color) normalized.color = v.color;
      if (v.quantity_value) normalized.quantity_value = v.quantity_value;
      if (v.unit) normalized.unit = v.unit;
      if (v.gsm) normalized.gsm = v.gsm;
      if (v.is_package !== undefined) normalized.is_package = v.is_package;
      if (v.package_quantity) normalized.package_quantity = v.package_quantity;
      return normalized;
    };

    const normalizedSearchVariant = normalizeVariant(variant);
    return data.find(item => {
      const normalizedItemVariant = normalizeVariant(item.variant);
      return JSON.stringify(normalizedItemVariant) === JSON.stringify(normalizedSearchVariant);
    }) || null;
  }

  // Smart add method that handles duplicates
  static async addToWishlistSmart(productOrComboOrKit, variant) {
    try {
      console.log('🔄 Adding to wishlist:', { productOrComboOrKit, variant });

      const res = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          product_id: productOrComboOrKit?.id || null,
          combo_id: productOrComboOrKit?.combo_id || null,
          kit_id: productOrComboOrKit?.kit_id || null,
          variant: variant
        })
      });

      const result = await res.json();
      console.log('📝 Add wishlist response:', result);

      if (!result.success) {
        if (result.error === 'Item already in wishlist') {
          return { success: false, message: 'Item already in wishlist', existing: true };
        }
        throw new Error(result.error);
      }

      return { success: true, wishlistItem: result.data, created: true };
    } catch (error) {
      console.error('❌ Add to wishlist error:', error);
      throw error;
    }
  }

  // Remove item from wishlist
  static async removeFromWishlist(wishlistItemId) {
    try {
      console.log('🗑️ Removing from wishlist:', wishlistItemId);

      const res = await fetch(`/api/wishlist/remove?id=${wishlistItemId}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies for authentication
      });

      const result = await res.json();
      console.log('🗑️ Remove wishlist response:', result);

      if (!result.success) throw new Error(result.error);

      return { success: true };
    } catch (error) {
      console.error('❌ Remove from wishlist error:', error);
      throw error;
    }
  }
}
