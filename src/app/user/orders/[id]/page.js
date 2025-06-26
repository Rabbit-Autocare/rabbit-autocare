// ✅ FILE: app/users/orders/[id]/page.js — Final Full Code (Same UI + Fetched from DB)
'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLayout from '@/components/layouts/UserLayout';
import Image from 'next/image';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (data) setOrder(data);
    setLoading(false);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (loading || !order) {
    return (
      <UserLayout>
        <div className="p-6 text-center">Loading order...</div>
      </UserLayout>
    );
  }

  const items = order.items || [];
  const shipping = order.user_info || {};

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Product Details */}
        {items.map((item, i) => {
          const image = item?.main_image_url || item?.images?.[0] || '/placeholder.jpg';
          return (
            <div className="text-center" key={i}>
              <div className="w-24 h-24 mx-auto mb-3">
                <Image
                  src={image}
                  alt={item?.name}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              </div>
              <h2 className="text-lg font-semibold">{item?.name}</h2>
              <p className="text-sm text-gray-600">
                Quantity: {item?.quantity} &nbsp;&nbsp; Price: ₹{item?.price}
              </p>
              <p className="text-sm text-gray-500">
                Order Placed On: {formatDate(order.created_at)}
              </p>
            </div>
          );
        })}

        {/* Status */}
        <div className="bg-gray-100 rounded-md p-4 text-sm">
          <span
            className={`font-semibold ${
              order.status === 'delivered'
                ? 'text-green-600'
                : order.status === 'shipped'
                ? 'text-purple-600'
                : 'text-red-600'
            }`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
          <p className="text-gray-500">
            {order.status === 'delivered'
              ? 'On ' + formatDate(order.completed_at || order.created_at)
              : order.status === 'shipped'
              ? 'Expected by ' + formatDate(order.estimated_delivery || order.created_at)
              : 'Updated on ' + formatDate(order.updated_at || order.created_at)}
          </p>
        </div>

        {/* Delivery Info */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Delivery Information</h3>
          <div className="border rounded-lg p-4 text-sm space-y-1">
            <p className="font-medium">Work</p>
            <p>{shipping.name}</p>
            <p>{shipping.address}</p>
            <p>Phone Number: {shipping.phone}</p>
            <p>Email: {shipping.email}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Payment Information</h3>
          <div className="border rounded-lg p-4 text-sm">
            Paid by {order.payment_method || 'Debit Card'}
          </div>
        </div>

        {/* Review Section */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Leave a Review</h3>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.123 4.305a.563.563 0 00.424.308l4.747.69a.563.563 0 01.312.96l-3.43 3.34a.563.563 0 00-.162.498l.81 4.725a.563.563 0 01-.818.593l-4.24-2.23a.563.563 0 00-.523 0l-4.24 2.23a.563.563 0 01-.818-.593l.81-4.725a.563.563 0 00-.162-.498l-3.43-3.34a.563.563 0 01.312-.96l4.747-.69a.563.563 0 00.424-.308l2.123-4.305z"
                />
              </svg>
            ))}
          </div>
        </div>

        {/* Your Review (static placeholder) */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Your Review</h3>
          <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-2">
            <div className="flex items-center gap-2 font-medium">
              Ava H.
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09L5.17 12.41 1 8.91l6.09-.88L10 2.5l2.91 5.53 6.09.88-4.17 3.5 1.05 5.68z" />
              </svg>
            </div>
            <p className="text-gray-600">
              "I'm not just wearing a t-shirt; I'm wearing a piece of design philosophy. The intricate details and thoughtful layout of the design make this shirt a conversation starter."
            </p>
            <p className="text-gray-400 text-xs">Posted on August 19, 2023</p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
