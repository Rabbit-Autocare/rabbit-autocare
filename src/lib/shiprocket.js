// src/lib/shiprocket.js
import axios from 'axios';

const SHIPROCKET_EMAIL = "rbtxnexus@gmail.com"; // ✅ Email you used to login to Shiprocket panel
const SHIPROCKET_PASSWORD = "Rbtx@rabbit25";     // ✅ Password for that email

let token = null;

export async function createShiprocketOrder(orderData) {
  if (!token) {
    try {
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: SHIPROCKET_EMAIL,
          password: SHIPROCKET_PASSWORD,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      token = response.data.token;
    } catch (error) {
      console.error("🚨 Failed to authenticate with Shiprocket:", error.response?.data || error.message);
      throw new Error("Shiprocket login failed.");
    }
  }

  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Shiprocket order creation failed:", error.response?.data || error.message);
    throw new Error("Failed to create Shiprocket order.");
  }
}
