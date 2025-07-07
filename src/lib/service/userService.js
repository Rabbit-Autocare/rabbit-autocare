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

    // Step 1: Get user's coupon ID list from auth_users table
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('coupons')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const couponIds = userData?.coupons || [];

    // Step 2: If no coupons, return empty list
    if (!Array.isArray(couponIds) || couponIds.length === 0) {
      return {
        success: true,
        data: {
          userCoupons: []
        }
      };
    }

    // Step 3: Fetch full coupon details only for coupons in user's array
    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .in('id', couponIds);

    if (couponError) throw couponError;

    // Step 4: Format result
    const formatCoupon = (coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || '',
      discount: coupon.discount_percent
        ? `${coupon.discount_percent}%`
        : 'Offer',
      validUpto: coupon.expiry_date,
      isActive: coupon.is_active
    });

    return {
      success: true,
      data: {
        userCoupons: couponData.map(formatCoupon)
      }
    };

  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error('Error fetching user coupons:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      data: {
        userCoupons: []
      }
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
