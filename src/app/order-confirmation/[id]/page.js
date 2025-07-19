"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const supabase = createSupabaseBrowserClient();

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Clear the redirect key on mount
    const redirectVal = localStorage.getItem('rbbit_redirect');
    console.log('[Order Confirmation] On mount, localStorage rbbit_redirect:', redirectVal);
    if (redirectVal) {
      localStorage.removeItem('rbbit_redirect');
      console.log('[Order Confirmation] Cleared rbbit_redirect from localStorage.');
    }
  }, []);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) {
        setError("Order not found or could not be loaded.");
        setOrder(null);
      } else {
        setOrder(data);
      }
      setLoading(false);
    }
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Loading your order confirmation...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">{error}</h2>
          <button
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded"
            onClick={() => router.push("/shop")}
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-xl w-full mx-auto p-8 bg-white rounded shadow text-center">
        <h1 className="text-3xl font-bold mb-4 text-purple-700">🎉 Order Confirmed!</h1>
        <p className="text-lg mb-2">Thank you for your purchase.</p>
        <p className="mb-4">Your order <span className="font-semibold">#{order.order_number}</span> has been placed successfully.</p>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <ul className="text-left inline-block">
            {order.items && order.items.map((item, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-medium">{item.name}</span> x {item.quantity} — ₹{item.total_price}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-lg">
            <span className="font-semibold">Total Paid:</span> ₹{order.total}
          </div>
        </div>
        <button
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded"
          onClick={() => router.push("/user/orders")}
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}
