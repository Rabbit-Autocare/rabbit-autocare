// src/app/api/razorpay/verify/route.js
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = body;

    // Debug logs
    console.log('[VERIFY] Incoming body:', body);
    console.log(
      '[VERIFY] Env secret available:',
      !!process.env.RAZORPAY_KEY_SECRET
    );

    // Validate inputs
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !order_id
    ) {
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
      `[VERIFY] Signature ${
        isValidSignature ? 'MATCHED' : 'FAILED'
      } for order ${order_id}`
    );

    // Update Supabase order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: isValidSignature ? 'paid' : 'failed',
        status: isValidSignature ? 'confirmed' : 'payment_failed',
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        payment_captured_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('[VERIFY] Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Order update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: isValidSignature });
  } catch (err) {
    console.error('[VERIFY] Unexpected error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
