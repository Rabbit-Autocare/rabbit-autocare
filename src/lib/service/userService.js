import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export class UserService {
  // ============= USER PROFILE =============

  static async getUserProfile(userId) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // ============= USER ORDERS =============

  static async getUserOrders(userId) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  static async getUserOrderDetails(orderId, userId) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user order details:', error);
      return { success: false, error: error.message };
    }
  }

  // ============= USER ADDRESSES =============

  static async getUserAddresses(userId) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ============= USER COUPONS =============

  static async getUserCoupons(userId) {
    try {
      const supabase = await createSupabaseServerClient();

      // 1. Fetch user's coupon IDs from auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Convert the user's coupons array to a Set for faster lookups
      const userCouponIds = new Set(userData?.coupons || []);

      // 2. Fetch all active coupons
      const { data: allActiveCoupons, error: activeCouponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (activeCouponsError) throw activeCouponsError;

      // 3. Fetch details for all of the user's coupons (even if inactive)
      let userCouponsDetails = [];
      if (userCouponIds.size > 0) {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .in('id', [...userCouponIds]);
        if (error) throw error;
        userCouponsDetails = data || [];
      }

      // 4. Helper to format coupon data consistently
      const formatCoupon = (coupon) => {
        const discount = coupon.discount_percent
          ? `${coupon.discount_percent}%`
          : coupon.discount_amount
          ? `₹${coupon.discount_amount}`
          : 'Offer';
        return {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount: discount,
          validUpto: coupon.expiry_date,
        };
      };

      // 5. Process both lists
      const processedUserCoupons = userCouponsDetails.map(formatCoupon);
      const processedAvailableCoupons = (allActiveCoupons || [])
        .filter(coupon => !userCouponIds.has(coupon.id))
        .map(formatCoupon);

      return {
        success: true,
        data: {
          userCoupons: processedUserCoupons,
          availableCoupons: processedAvailableCoupons,
        },
      };
    } catch (error) {
      const errorMessage = error.message || JSON.stringify(error);
      console.error('Error fetching user coupons:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        data: { userCoupons: [], availableCoupons: [] },
      };
    }
  }

  // ============= USER SESSION =============

  static async getUserSession() {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Error fetching user session:', error);
      return { success: false, error: error.message, user: null };
    }
  }

  // ============= UPDATE USER PROFILE =============

  static async updateUserProfile(userId, updateData) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('auth_users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // ============= CREATE USER ADDRESS =============

  static async createUserAddress(addressData) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user address:', error);
      return { success: false, error: error.message };
    }
  }

  // ============= UPDATE USER ADDRESS =============

  static async updateUserAddress(addressId, updateData) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', addressId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user address:', error);
      return { success: false, error: error.message };
    }
  }

  // ============= DELETE USER ADDRESS =============

  static async deleteUserAddress(addressId) {
    try {
      const supabase = await createSupabaseServerClient();

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting user address:', error);
      return { success: false, error: error.message };
    }
  }
}
