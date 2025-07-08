import { createSupabaseServerClient } from '@/lib/supabase/server-client';

/**
 * Server-side function to fetch initial combos for cart
 */
export async function fetchInitialCombos(userId) {
  if (!userId) return [];

  try {
    const supabase = await createSupabaseServerClient();

    // Fetch available combos (simplified query for initial load)
    const { data: combos, error } = await supabase
      .from('combos')
      .select(
        `
        *,
        combo_products (
          *,
          product:products (*)
        )
      `
      )
      .eq('is_active', true)
      .limit(5);

    if (error) {
      console.error('Error fetching initial combos:', error);
      return [];
    }

    return (
      combos.map((combo) => ({
        ...combo,
        image_url:
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        main_image_url:
          combo.main_image_url ||
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
      })) || []
    );
  } catch (error) {
    console.error('Error in fetchInitialCombos:', error);
    return [];
  }
}

/**
 * Server-side function to fetch initial coupons for cart
 */
export async function fetchInitialCoupons(userId) {
  if (!userId) return [];

  try {
    const supabase = await createSupabaseServerClient();

    // Get user's available coupons
    const { data: userProfile, error: userError } = await supabase
      .from('auth_users')
      .select('coupons')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user coupons:', userError);
      return [];
    }

    const userCouponIds = userProfile?.coupons || [];

    if (userCouponIds.length === 0) {
      return [];
    }

    // Fetch the actual coupon details
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .in('id', userCouponIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError);
      return [];
    }

    // Filter out expired coupons
    const now = new Date();
    const validCoupons = coupons.filter((coupon) => {
      if (coupon.is_permanent) return true;
      if (!coupon.expiry_date) return true;
      return new Date(coupon.expiry_date) > now;
    });

    return validCoupons || [];
  } catch (error) {
    console.error('Error in fetchInitialCoupons:', error);
    return [];
  }
}
