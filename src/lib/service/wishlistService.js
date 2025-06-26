import { supabase } from '../supabaseClient';

export class WishlistService {
  static async addToWishlist({ product_id, variant, combo_id, kit_id }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('wishlist_items').insert({
      user_id: user.id,
      product_id,
      variant,
      combo_id,
      kit_id,
    });
  }

  static async removeFromWishlist(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.from('wishlist_items').delete().eq('id', id).eq('user_id', user.id);
  }

  static async getWishlist() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase
      .from('wishlist_items')
      .select(`
        id, product_id, variant, combo_id, kit_id, created_at, updated_at,
        products:product_id (id, name, price, image, category)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  }
}