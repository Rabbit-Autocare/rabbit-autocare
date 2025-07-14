// /api/track-order/[awb_code].js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket/token';

export async function GET(req, { params }) {
  const awb_code = params.awb_code;
  const token = await getShiprocketToken(); // Get fresh token

  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb_code}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
