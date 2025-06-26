// src/app/api/razorpay/verify/route.js
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Debug logs
    console.log('[VERIFY] Incoming body:', body);
    console.log('[VERIFY] Env secret available:', !!process.env.RAZORPAY_KEY_SECRET);

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('[VERIFY] Missing required fields:', body);
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[VERIFY] Missing RAZORPAY_KEY_SECRET in environment');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    // Signature verification
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValidSignature = generatedSignature === razorpay_signature;

    console.log(
      `[VERIFY] Signature ${isValidSignature ? 'MATCHED' : 'FAILED'} for order ${razorpay_order_id}`
    );

    return NextResponse.json({ success: isValidSignature });
  } catch (err) {
    console.error('[VERIFY] Unexpected error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
