'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InvoiceTemplate({ orderNumber }) {
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState(null);
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

      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', orderData.shipping_address_id)
        .single();

      setAddress(addressData);
    }

    fetchOrder();
  }, [orderNumber]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!order || !address) return <div className="p-4">Loading...</div>;

  const {
    order_number,
    created_at,
    items,
    delivery_charge,
    discount,
    payment_method,
  } = order;

  const total =
    items.reduce(
      (sum, item) => sum + (item.base_price || 0) * (item.quantity || 1),
      0
    ) + (delivery_charge || 0) - (discount || 0);

  const cgst = total * 0.09;
  const sgst = total * 0.09;
  const totalWithGst = total + cgst + sgst;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-10 print:bg-white">
      <div className="mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Print / Download Invoice
        </button>
      </div>

      <div className="w-[1200px] h-[1800px] bg-white text-black font-sans p-10 text-sm shadow-lg">
        <div className="flex justify-between mb-6 border-b pb-4 items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-wide">TAX INVOICE</h1>
            <p>INVOICE NO.: {order_number}</p>
            <p>INVOICE DATE: {new Date(created_at).toLocaleDateString()}</p>
            <p>ORDER NO.: {order_number}</p>
            <p>PAYMENT METHOD: {payment_method || 'Prepaid'}</p>
          </div>
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Company Logo" width={120} height={60} />
            <QRCode value={`https://yourstore.com/orders/${order_number}`} size={80} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h2 className="font-semibold mb-2">SHIPPING ADDRESS:</h2>
            <p>{address?.full_name}</p>
            <p>{address?.street}</p>
            <p>{address?.city} - {address?.postal_code}</p>
            <p>{address?.state}, India</p>
            <p>Ph: {address?.phone}</p>
            <p>State Code: 06</p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">SOLD BY:</h2>
            <p>RBTX NEXUS PRIVATE LIMITED</p>
            <p>Gali no. 1, shastri nagar, amin road, thanesar</p>
            <p>Near Kohinoor Guesthouse</p>
            <p>Kurukshetra 136118, Haryana</p>
            <p>Ph: 7206592521</p>
            <p>GSTIN No. 06AAOCR6204Q1ZS</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">ORDER ITEMS:</h3>
          <table className="w-full border border-black text-sm">
            <thead className="bg-gray-100">
              <tr className="border-b border-black">
                <th className="text-left p-2">S.NO.</th>
                <th className="text-left p-2">PRODUCT NAME</th>
                <th className="text-left p-2">HSN</th>
                <th className="text-left p-2">QTY</th>
                <th className="text-left p-2">UNIT PRICE</th>
                <th className="text-left p-2">TAXABLE VALUE</th>
                <th className="text-left p-2">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.name}<br /><span className="text-xs text-gray-500">SKU: {item.variant?.variant_code || 'N/A'}</span></td>
                  <td className="p-2">{item.hsn_code || '—'}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">₹{item.base_price?.toFixed(2)}</td>
                  <td className="p-2">₹{item.base_price_excluding_gst?.toFixed(2) || item.base_price?.toFixed(2)}</td>
                  <td className="p-2">₹{(item.base_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="p-2 text-right font-semibold">Shipping Charges</td>
                <td className="p-2">₹{delivery_charge?.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-2 text-right font-semibold">Discount</td>
                <td className="p-2">-₹{discount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-2 text-right font-semibold">CGST @ 9%</td>
                <td className="p-2">₹{cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-2 text-right font-semibold">SGST @ 9%</td>
                <td className="p-2">₹{sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="p-2 text-right font-bold">NET TOTAL</td>
                <td className="p-2 font-bold">₹{totalWithGst.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 border-t pt-4 text-sm">
          <p>Whether tax is payable under reverse charge: <span className="font-semibold">No</span></p>
          <p className="mt-12 text-right">Authorized Signature for<br /><span className="font-bold">RBTX NEXUS PRIVATE LIMITED</span></p>

          <div className="mt-10 text-xs text-gray-600 border-t pt-4">
            <p className="font-semibold mb-2">Terms and Conditions:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>All disputes are subject to Kurukshetra jurisdiction.</li>
              <li>Please preserve this invoice for warranty claims.</li>
            </ul>
            <p className="mt-6 text-center font-medium">Thank you for shopping with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
