import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export class ClientUserService {
  static async getUserCoupons(userId) {
    console.log('ClientUserService - getUserCoupons called for userId:', userId);

    if (!userId) {
      return {
        success: false,
        data: {
          userCoupons: [],
          availableCoupons: []
        }
      };
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const now = new Date().toISOString();

      // 1. Fetch user coupon IDs from auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const userCouponIds = new Set(userData?.coupons || []);
      console.log('Coupon IDs from user table:', [...userCouponIds]);

      // 2. Fetch full details of user's coupons only
      let userCouponsDetails = [];
      if (userCouponIds.size > 0) {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .in('id', [...userCouponIds]);

        if (error) throw error;
        userCouponsDetails = data || [];
      }

      // 3. Filter only active & valid user coupons
      const validUserCoupons = userCouponsDetails.filter(coupon => {
        if (!coupon.is_active) return false;
        if (!coupon.is_permanent && coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return false;
        return true;
      });

      // 4. Only return coupons from user's list as available
      const availableCoupons = validUserCoupons;

      // 5. Format utility
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
          userCoupons: validUserCoupons.map(formatCoupon),
          availableCoupons: availableCoupons.map(formatCoupon)
        }
      };
    } catch (error) {
      console.error('ClientUserService - Error in getUserCoupons:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        data: {
          userCoupons: [],
          availableCoupons: []
        }
      };
    }
  }
}
