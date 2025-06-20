import { NextResponse } from 'next/server';
import { UserService } from '@/lib/service/userService';

// Get user's coupons
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await UserService.getUserCoupons(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/user/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a coupon to user
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, coupon } = body;

    if (!userId || !coupon) {
      return NextResponse.json(
        { error: 'userId and coupon are required' },
        { status: 400 }
      );
    }

    const result = await UserService.addCouponToUser(userId, coupon);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in POST /api/user/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove a coupon from user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const couponCode = searchParams.get('couponCode');

    if (!userId || !couponCode) {
      return NextResponse.json(
        { error: 'userId and couponCode are required' },
        { status: 400 }
      );
    }

    const result = await UserService.removeCouponFromUser(userId, couponCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in DELETE /api/user/coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
