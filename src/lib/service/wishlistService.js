import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

export class WishlistService {
  // Get current user's wishlist items
  static async getWishlist() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    // Use the new API route for fetching wishlist
    const res = await fetch(`/api/wishlist?user_id=${user.id}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch wishlist');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    let isCombo = false;
    let isKit = false;
    let comboId = null;
    let kitId = null;
    let productId = null;
    let variantToStore = null;

    if (productOrComboOrKit && productOrComboOrKit.combo_id) {
      isCombo = true;
      comboId = productOrComboOrKit.combo_id;
      variantToStore = Array.isArray(variant) ? variant.map(v => ({ ...v })) : [];
    } else if (productOrComboOrKit && productOrComboOrKit.kit_id) {
      isKit = true;
      kitId = productOrComboOrKit.kit_id;
      variantToStore = Array.isArray(variant) ? variant.map(v => ({ ...v })) : [];
    } else if (productOrComboOrKit && productOrComboOrKit.id) {
      productId = productOrComboOrKit.id;
      variantToStore = { ...variant };
    }

    // Check if this item already exists in the wishlist
    let existingItem = null;
    if (isCombo) {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('combo_id', comboId)
        .single();
      if (!error && data) existingItem = data;
    } else if (isKit) {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('kit_id', kitId)
        .single();
      if (!error && data) existingItem = data;
    } else if (productId) {
      existingItem = await this.findExistingWishlistItem(productId, variantToStore, user.id);
    }

    if (existingItem) {
      return { success: false, message: 'Item already in wishlist', existing: true };
    }

    // Insert new wishlist item
    const wishlistItem = {
      user_id: user.id,
      product_id: productId || null,
      variant: (productId && variantToStore) ? variantToStore : ((isCombo || isKit) ? variantToStore : null),
      combo_id: isCombo ? comboId : null,
      kit_id: isKit ? kitId : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (wishlistItem.product_id && typeof wishlistItem.product_id !== 'number') {
      wishlistItem.product_id = null;
    }
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([wishlistItem])
      .select()
      .single();
    if (error) throw error;
    return { success: true, wishlistItem: data, created: true };
  }

  // Remove item from wishlist
  static async removeFromWishlist(wishlistItemId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistItemId)
      .eq('user_id', user.id);
    if (error) throw error;
    return { success: true };
  }
}
