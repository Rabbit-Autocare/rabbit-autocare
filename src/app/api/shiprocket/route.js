import { NextResponse } from 'next/server';
import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let token = null;
let tokenExpiry = null;

async function getShiprocketToken() {
  // Reuse token if valid
  if (token && tokenExpiry && Date.now() < tokenExpiry) return token;

  const res = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/auth/login',
    {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  token = res.data.token;
  tokenExpiry = Date.now() + 9 * 60 * 1000; // 9 mins token validity
  return token;
}

export async function POST(request) {
  try {
    const orderData = await request.json();
    console.log('Shiprocket orderData:', orderData);

    const token = await getShiprocketToken();
    console.log('Shiprocket token:', token);

    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Shiprocket API response:', response.data);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('❌ Shiprocket API error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: error?.response?.data || error.message },
      { status: 500 }
    );
  }
}