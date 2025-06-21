import { NextResponse } from 'next/server';
import CouponService from '@/lib/service/couponService';

// POST - Validate coupon code
export async function POST(request) {
  try {
    const { couponCode, userId, orderAmount } = await request.json();

    if (!couponCode) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (orderAmount === undefined || orderAmount === null) {
      return NextResponse.json({ error: 'Order amount is required' }, { status: 400 });
    }

    const result = await CouponService.applyCoupon(couponCode, userId, orderAmount);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discount: result.discount,
      coupon: result.coupon
    });
  } catch (error) {
    console.error('POST /api/coupons/validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
