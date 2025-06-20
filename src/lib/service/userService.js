import { supabase } from '../supabaseClient';

export const UserService = {
  // Get user details by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user details by email
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user details
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's coupons
  async getUserCoupons(userId) {
    try {
      // First get the user's coupon IDs
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // If no coupons, return empty array
      if (!userData?.coupons || !Array.isArray(userData.coupons) || userData.coupons.length === 0) {
        return { success: true, data: [] };
      }

      // Fetch complete coupon details from coupons table
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .in('id', userData.coupons)
        .eq('is_active', true);

      if (couponsError) throw couponsError;

      // Transform coupon data to match the expected format
      const transformedCoupons = couponsData.map(coupon => ({
        code: coupon.code,
        description: coupon.description || `${coupon.discount_percent}% off`,
        discount: `${coupon.discount_percent}%`,
        expiry: coupon.is_permanent ? null : coupon.expiry_date,
        min_order_amount: coupon.min_order_amount,
        is_permanent: coupon.is_permanent
      }));

      return { success: true, data: transformedCoupons };
    } catch (error) {
      console.error('Error getting user coupons:', error);
      return { success: false, error: error.message };
    }
  },

  // Add a coupon to user
  async addCouponToUser(userId, coupon) {
    try {
      const { data: userData } = await this.getUserById(userId);
      const currentCoupons = userData.coupons || [];

      // Check if coupon already exists
      if (currentCoupons.some(c => c.code === coupon.code)) {
        return { success: false, error: 'Coupon already exists' };
      }

      const updatedCoupons = [...currentCoupons, coupon];

      const { data, error } = await supabase
        .from('auth_users')
        .update({ coupons: updatedCoupons })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error adding coupon:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove a coupon from user
  async removeCouponFromUser(userId, couponCode) {
    try {
      const { data: userData } = await this.getUserById(userId);
      const currentCoupons = userData.coupons || [];
      const updatedCoupons = currentCoupons.filter(c => c.code !== couponCode);

      const { data, error } = await supabase
        .from('auth_users')
        .update({ coupons: updatedCoupons })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error removing coupon:', error);
      return { success: false, error: error.message };
    }
  }
};
