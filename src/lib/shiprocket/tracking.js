import axios from 'axios';
import { getShiprocketToken } from './auth'; // You may already have this

export async function getTrackingDetails(awb_code) {
  if (!awb_code) return null;

  const token = await getShiprocketToken();

  try {
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb_code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Tracking error:', error.response?.data || error.message);
    return null;
  }
}
