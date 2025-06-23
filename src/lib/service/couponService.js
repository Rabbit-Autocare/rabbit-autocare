import { supabase } from '@/lib/supabaseClient';

class CouponService {
  // Create a new coupon
  static async createCoupon(couponData) {
    try {
      console.log('Starting coupon creation with data:', couponData);

      // First, verify the data
      if (!couponData.code || !couponData.discount_percent) {
        console.error('Missing required fields:', { code: couponData.code, discount_percent: couponData.discount_percent });
        throw new Error('Missing required fields');
      }

      // Prepare the coupon data with explicit type casting
      const couponToInsert = {
        code: String(couponData.code).toUpperCase().trim(),
        description: String(couponData.description || '').trim(),
        discount_percent: Number(couponData.discount_percent),
        min_order_amount: Number(couponData.min_order_amount || 0),
        is_permanent: Boolean(couponData.is_permanent || false),
        expiry_date: couponData.is_permanent ? null : String(couponData.expiry_date),
        is_active: true,
        usage_count: 0
      };

      // Validate numeric fields
      if (isNaN(couponToInsert.discount_percent) || isNaN(couponToInsert.min_order_amount)) {
        throw new Error('Invalid numeric values in coupon data');
      }

      console.log('Attempting to insert coupon:', couponToInsert);

      // Try to insert the coupon
      const { data, error } = await supabase
        .from('coupons')
        .insert([couponToInsert])
        .select()
        .single();

      if (error) {
        console.error('Database error during coupon creation:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned after coupon creation');
        throw new Error('Failed to create coupon - no data returned');
      }

      console.log('Coupon created successfully in database:', data);

      // Verify the coupon exists
      const { data: verifyData, error: verifyError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError) {
        console.error('Error verifying coupon creation:', verifyError);
      } else {
        console.log('Verified coupon exists in database:', verifyData);
      }

      // Check users' coupons
      const { data: users, error: usersError } = await supabase
        .from('auth_users')
        .select('id, email, coupons')
        .limit(5);

      if (usersError) {
        console.error('Error checking users after coupon creation:', usersError);
      } else {
        console.log('Current state of users\' coupons:');
        users.forEach(user => {
          console.log(`User ${user.email}:`, {
            id: user.id,
            coupons: user.coupons
          });
        });
      }

      return { success: true, coupon: data };
    } catch (error) {
      console.error('Error in createCoupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all coupons
  static async getAllCoupons() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, coupons: data };
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active coupons
  static async getActiveCoupons() {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`is_permanent.eq.true,and(is_permanent.eq.false,expiry_date.gt.${now})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, coupons: data };
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      return { success: false, error: error.message };
    }
  }

  // Update coupon
  static async updateCoupon(couponId, updateData) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', couponId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, coupon: data };
    } catch (error) {
      console.error('Error updating coupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete coupon
  static async deleteCoupon(couponId) {
    try {
      console.log('Starting coupon deletion for ID:', couponId);

      // Delete the coupon - the trigger will handle removing it from users
      const { error: deleteError } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (deleteError) {
        console.error('Error deleting coupon:', deleteError);
        throw deleteError;
      }

      console.log('Successfully deleted coupon from database');

      // Verify deletion
      const { data: verifyData, error: verifyError } = await supabase
        .from('coupons')
        .select('id')
        .eq('id', couponId)
        .single();

      if (verifyError && verifyError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error verifying deletion:', verifyError);
        throw verifyError;
      }

      if (verifyData) {
        console.error('Coupon still exists after deletion');
        throw new Error('Coupon deletion failed - coupon still exists');
      }

      console.log('Verified coupon deletion');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteCoupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Apply coupon to order
  static async applyCoupon(couponCode, userId, orderAmount) {
    try {
      // Get coupon details
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();

      if (couponError) throw couponError;
      if (!coupon) throw new Error('Coupon not found');

      // Check if coupon is valid
      if (!coupon.is_active) throw new Error('Coupon is not active');
      if (!coupon.is_permanent && new Date(coupon.expiry_date) < new Date()) {
        throw new Error('Coupon has expired');
      }
      if (orderAmount < coupon.min_order_amount) {
        throw new Error(`Minimum order amount of ₹${coupon.min_order_amount} required`);
      }

      // Check if user has this coupon (using correct table name)
      // Temporarily commented out for testing - uncomment when user coupon assignment is working
      /*
      const { data: user, error: userError } = await supabase
        .from('auth_users') // Changed from auth_users to auth_users
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Handle both array and JSON string formats
      let userCoupons = [];
      if (user.coupons) {
        if (Array.isArray(user.coupons)) {
          userCoupons = user.coupons;
        } else if (typeof user.coupons === 'string') {
          try {
            userCoupons = JSON.parse(user.coupons);
          } catch (e) {
            console.error('Error parsing user coupons:', e);
            userCoupons = [];
          }
        }
      }

      if (!userCoupons.includes(coupon.id)) {
        throw new Error('Coupon not available for this user');
      }
      */

      // Calculate discount
      const discount = (orderAmount * coupon.discount_percent) / 100;

      return {
        success: true,
        discount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_percent: coupon.discount_percent,
          description: coupon.description
        }
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove used coupon from user
  static async removeUsedCoupon(couponId, userId) {
    try {
      // Remove coupon from user's coupons (using correct table name)
      const { error: userError } = await supabase
        .from('auth_users') // Changed from auth_users to auth_users
        .update({
          coupons: supabase.raw('array_remove(coupons, ?)', [couponId])
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Increment usage count
      const { error: couponError } = await supabase
        .from('coupons')
        .update({
          usage_count: supabase.raw('usage_count + 1')
        })
        .eq('id', couponId);

      if (couponError) throw couponError;

      return { success: true };
    } catch (error) {
      console.error('Error removing used coupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Check coupon validity
  static async validateCoupon(couponCode) {
    try {
      const now = new Date().toISOString();
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .or(`is_permanent.eq.true,and(is_permanent.eq.false,expiry_date.gt.${now})`)
        .single();

      if (error) throw error;
      if (!coupon) throw new Error('Invalid or expired coupon');

      return {
        success: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_percent: coupon.discount_percent,
          min_order_amount: coupon.min_order_amount,
          description: coupon.description
        }
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { success: false, error: error.message };
    }
  }

  // Add coupon to user
  static async addCouponToUser(userId, couponId) {
    try {
      // Get current user coupons
      const { data: user, error: fetchError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Handle both array and JSON string formats
      let currentCoupons = [];
      if (user.coupons) {
        if (Array.isArray(user.coupons)) {
          currentCoupons = user.coupons;
        } else if (typeof user.coupons === 'string') {
          try {
            currentCoupons = JSON.parse(user.coupons);
          } catch (e) {
            console.error('Error parsing user coupons:', e);
            currentCoupons = [];
          }
        }
      }

      // Add coupon if not already present
      if (!currentCoupons.includes(couponId)) {
        currentCoupons.push(couponId);

        const { error: updateError } = await supabase
          .from('auth_users')
          .update({ coupons: currentCoupons })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding coupon to user:', error);
      return { success: false, error: error.message };
    }
  }
}

export default CouponService;
