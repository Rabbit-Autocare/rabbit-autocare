import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export class ClientUserService {
  static async getUserCoupons(userId) {
    console.log('ClientUserService - getUserCoupons called for userId:', userId);

    if (!userId) {
      console.log('ClientUserService - No userId provided');
      return { success: false, data: { userCoupons: [], availableCoupons: [] } };
    }

    try {
      const supabase = createSupabaseBrowserClient();
      console.log('ClientUserService - Supabase client created');

      // 1. Fetch user's coupon IDs from auth_users table
      console.log('ClientUserService - Fetching user coupons from auth_users');
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('coupons')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('ClientUserService - Error fetching user data:', userError);
        throw userError;
      }
      console.log('ClientUserService - User data received:', userData);

      const userCouponIds = new Set(userData?.coupons || []);
      console.log('ClientUserService - User coupon IDs:', [...userCouponIds]);

      // 2. Fetch all active coupons
      console.log('ClientUserService - Fetching active coupons');
      const { data: allActiveCoupons, error: activeCouponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (activeCouponsError) {
        console.error('ClientUserService - Error fetching active coupons:', activeCouponsError);
        throw activeCouponsError;
      }
      console.log('ClientUserService - Active coupons received:', allActiveCoupons?.length || 0);

      // 3. Fetch details for all of the user's coupons
      let userCouponsDetails = [];
      if (userCouponIds.size > 0) {
        console.log('ClientUserService - Fetching user coupon details');
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .in('id', [...userCouponIds]);

        if (error) {
          console.error('ClientUserService - Error fetching user coupon details:', error);
          throw error;
        }
        userCouponsDetails = data || [];
        console.log('ClientUserService - User coupon details received:', userCouponsDetails.length);
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

      console.log('ClientUserService - Final processed data:', {
        userCoupons: processedUserCoupons.length,
        availableCoupons: processedAvailableCoupons.length
      });

      return {
        success: true,
        data: {
          userCoupons: processedUserCoupons,
          availableCoupons: processedAvailableCoupons,
        },
      };
    } catch (error) {
      const errorMessage = error.message || JSON.stringify(error);
      console.error('ClientUserService - Error in getUserCoupons:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        data: { userCoupons: [], availableCoupons: [] },
      };
    }
  }
}
