import { NextResponse } from 'next/server';
import { UserService } from '@/lib/service/userService';

// Get all addresses for the authenticated user
export async function GET(request) {
  try {
    // Get user from session (SSR context)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const result = await UserService.getUserAddresses(userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/user/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new address
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, address } = body;
    if (!userId || !address) {
      return NextResponse.json({ error: 'userId and address are required' }, { status: 400 });
    }
    const result = await UserService.createUserAddress({ ...address, user_id: userId });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in POST /api/user/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update an address
export async function PUT(request) {
  try {
    const body = await request.json();
    const { addressId, updateData } = body;
    if (!addressId || !updateData) {
      return NextResponse.json({ error: 'addressId and updateData are required' }, { status: 400 });
    }
    const result = await UserService.updateUserAddress(addressId, updateData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PUT /api/user/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete an address
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');
    if (!addressId) {
      return NextResponse.json({ error: 'addressId is required' }, { status: 400 });
    }
    const result = await UserService.deleteUserAddress(addressId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
