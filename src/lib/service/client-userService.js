import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export class ClientUserService {
  static async getUserCoupons(userId) {
    console.log('ClientUserService - getUserCoupons called for userId:', userId);

    if (!userId) {
      console.log('ClientUserService - No userId provided');
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

      // 1. Get user's coupon IDs from auth_users
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      const userCouponIds = new Set(userData?.coupons || []);
      console.log('Coupon IDs from user table:', [...userCouponIds]);

      // 2. Fetch full details of user's coupons
      let userCouponsDetails = [];
      if (userCouponIds.size > 0) {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .in('id', [...userCouponIds]);

        if (error) throw error;
        userCouponsDetails = data || [];
      }

      // 3. Fetch all active, valid coupons
      const { data: allActiveCoupons, error: activeError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`is_permanent.eq.true,and(is_permanent.eq.false,expiry_date.gt.${now})`);

      if (activeError) throw activeError;

      // 4. Helper to format coupon data
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

      // 5. Filter user coupons for only valid ones
      const filteredUserCoupons = userCouponsDetails.filter(coupon => {
        if (!coupon.is_active) return false;
        if (!coupon.is_permanent && coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return false;
        return true;
      });

      // 6. Filter active coupons not in user's list
      const filteredAvailableCoupons = (allActiveCoupons || []).filter(
        coupon => !userCouponIds.has(coupon.id)
      );

      return {
        success: true,
        data: {
          userCoupons: filteredUserCoupons.map(formatCoupon),
          availableCoupons: filteredAvailableCoupons.map(formatCoupon)
        }
      };
    } catch (error) {
      const errorMessage = error.message || JSON.stringify(error);
      console.error('ClientUserService - Error in getUserCoupons:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        data: {
          userCoupons: [],
          availableCoupons: []
        }
      };
    }
  }
}
