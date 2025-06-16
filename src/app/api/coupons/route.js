import { NextResponse } from 'next/server';
import CouponService from '@/lib/service/couponService';
import { supabase } from '@/lib/supabaseClient';

// GET - Get all coupons (admin only)
export async function GET(request) {
  try {
    const result = await CouponService.getAllCoupons();
    return NextResponse.json({
      success: true,
      coupons: result.coupons
    });
  } catch (error) {
    console.error('GET /api/coupons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new coupon (admin only)
export async function POST(request) {
  try {
    console.log('Received coupon creation request');
    const couponData = await request.json();
    console.log('Parsed coupon data:', couponData);

    if (!couponData.code || !couponData.discount_percent) {
      console.error('Missing required fields:', { code: couponData.code, discount_percent: couponData.discount_percent });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await CouponService.createCoupon(couponData);
    console.log('Coupon creation result:', result);

    if (!result.success) {
      console.error('Coupon creation failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupon: result.coupon
    });
  } catch (error) {
    console.error('POST /api/coupons error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update coupon (admin only)
export async function PUT(request) {
  try {
    const { id, ...updateData } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const result = await CouponService.updateCoupon(id, updateData);
    return NextResponse.json({
      success: true,
      coupon: result.coupon
    });
  } catch (error) {
    console.error('PUT /api/coupons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete coupon (admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Attempting to delete coupon with ID:', id);

    if (!id) {
      console.error('No coupon ID provided');
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    // First verify the coupon exists
    const { data: existingCoupon, error: checkError } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking coupon existence:', checkError);
      return NextResponse.json({ error: 'Error checking coupon' }, { status: 500 });
    }

    if (!existingCoupon) {
      console.error('Coupon not found:', id);
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    console.log('Found coupon to delete:', existingCoupon);

    const result = await CouponService.deleteCoupon(id);
    console.log('Delete result:', result);

    if (!result.success) {
      console.error('Failed to delete coupon:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/coupons error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
