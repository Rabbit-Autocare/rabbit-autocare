'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Truck, CreditCard, Tag, User, MapPin, Receipt } from 'lucide-react';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const statusColors = {
  confirmed: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
};

export default function AdminOrderDetails({ orderNumber }) {
  const [order, setOrder] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [billingAddress, setBillingAddress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();
      if (error || !orderData) {
        setError('Order not found');
        return;
      }
      setOrder(orderData);
      if (orderData.shipping_address_id) {
        const { data: shipping } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', orderData.shipping_address_id)
          .single();
        setShippingAddress(shipping);
      }
      if (orderData.billing_address_id) {
        const { data: billing } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', orderData.billing_address_id)
          .single();
        setBillingAddress(billing);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!order) return <div className="p-4">Loading...</div>;

  const {
    order_number,
    created_at,
    status,
    payment_status,
    payment_method,
    user_info,
    items = [],
    subtotal,
    discount_amount,
    delivery_charge,
    total,
    coupon_id,
    awb_code,
  } = order;

  const statusClass = statusColors[status?.toLowerCase()] || statusColors.default;
  const paymentIcon = payment_status === 'paid' ? <CheckCircle className="inline w-5 h-5 text-green-500 mr-1" /> : <XCircle className="inline w-5 h-5 text-red-500 mr-1" />;

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 sm:px-0 font-inter">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-7 h-7 text-purple-700" />
              <h2 className="text-2xl font-bold tracking-tight">Order #{order_number}</h2>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-xs mb-2">
              <span className={`px-3 py-1 rounded-full font-semibold ${statusClass}`}>{status || 'Processing'}</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">{new Date(created_at).toLocaleString()}</span>
              {coupon_id && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Tag className="w-4 h-4" />{coupon_id}</span>}
              {awb_code && <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><Truck className="w-4 h-4" />{awb_code}</span>}
            </div>
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1"><CreditCard className="w-4 h-4" />{payment_method || (payment_status === 'paid' ? 'Prepaid' : 'Postpaid')}</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">{paymentIcon}{payment_status || '-'}</span>
            </div>
          </div>
          <div>
            <Link href={`/admin/orders/${order_number}/invoice`} target="_blank">
              <button className="px-7 py-3 bg-gradient-to-r from-purple-700 to-black text-white rounded-xl font-semibold shadow hover:from-purple-800 hover:to-gray-900 transition text-base">Print / Download Invoice</button>
            </Link>
          </div>
        </div>
        {/* Customer Info */}
        {user_info && (
          <div className="mb-6 p-4 rounded-xl bg-gray-50 flex items-center gap-4">
            <User className="w-8 h-8 text-purple-700" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-1">{user_info.full_name || user_info.name || '-'}</div>
              <div className="text-gray-600">{user_info.email || '-'}</div>
              <div className="text-gray-600">{user_info.phone || '-'}</div>
            </div>
          </div>
        )}
        {/* Addresses */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 font-semibold text-gray-900"><MapPin className="w-5 h-5 text-purple-700" />Shipping Address</div>
            {shippingAddress ? (
              <div>
                <div>{shippingAddress.full_name}</div>
                <div>{shippingAddress.street}</div>
                <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</div>
                <div>{shippingAddress.phone}</div>
              </div>
            ) : (
              <div>N/A</div>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 font-semibold text-gray-900"><MapPin className="w-5 h-5 text-purple-700" />Billing Address</div>
            {billingAddress ? (
              <div>
                <div>{billingAddress.full_name}</div>
                <div>{billingAddress.street}</div>
                <div>{billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}</div>
                <div>{billingAddress.phone}</div>
              </div>
            ) : (
              <div>N/A</div>
            )}
          </div>
        </div>
        {/* Order Items */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3 text-lg">Order Items</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-left">Variant</th>
                  <th className="p-3 text-left">Qty</th>
                  <th className="p-3 text-left">Unit Price</th>
                  <th className="p-3 text-left">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium">{idx + 1}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.variant?.variant_code || 'N/A'}</td>
                    <td className="p-3">{item.variant?.variant_display_text || item.variant?.size || '-'}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">₹{item.price || item.base_price}</td>
                    <td className="p-3">₹{((item.price || item.base_price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Order Summary */}
        <div className="mb-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="font-semibold text-gray-900 mb-2 text-lg">Order Summary</div>
            <div className="flex justify-between mb-1"><span>Subtotal:</span> <span>₹{subtotal || '-'}</span></div>
            <div className="flex justify-between mb-1"><span>Discount:</span> <span className="text-green-700">-₹{discount_amount || 0}</span></div>
            <div className="flex justify-between mb-1"><span>Delivery Charge:</span> <span>₹{delivery_charge || 0}</span></div>
            <div className="flex justify-between mt-2 text-lg font-bold"><span>Total:</span> <span>₹{total}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
