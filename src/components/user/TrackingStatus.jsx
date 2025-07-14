'use client';
import React, { useEffect, useState } from 'react';
import { FaShippingFast, FaCheckCircle, FaTruck, FaBoxOpen } from 'react-icons/fa';
import AOS from 'aos';

const stageIcons = {
  'Order Placed': <FaCheckCircle className="text-blue-500" />,
  'Shipped': <FaTruck className="text-yellow-500" />,
  'Out for Delivery': <FaShippingFast className="text-green-500" />,
  'Delivered': <FaBoxOpen className="text-teal-500" />,
};

export default function TrackingStatus({ awb_code }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ once: true });

    async function fetchTracking() {
      try {
        const res = await fetch(`/api/track-order/${awb_code}`);
        const data = await res.json();
        setTracking(data);
      } catch (err) {
        console.error('Tracking fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (awb_code) fetchTracking();
  }, [awb_code]);

  if (loading) return <p className="text-gray-500">Loading tracking info...</p>;
  if (!tracking || tracking?.tracking_data?.track_status !== 1) return <p className="text-red-600">Tracking info unavailable.</p>;

  const status = tracking.tracking_data.current_status;
  const history = tracking.tracking_data.shipment_track_activities || [];

  return (
    <div className="mt-10 border rounded-lg shadow-sm bg-white p-6" data-aos="fade-up">
      <h2 className="text-xl font-semibold mb-4">📦 Order Tracking</h2>
      <div className="flex items-center gap-4 mb-6">
        <div className="text-2xl">{stageIcons[status] || <FaCheckCircle className="text-gray-400" />}</div>
        <div>
          <p className="font-medium text-lg">{status}</p>
          <p className="text-sm text-gray-500">{tracking.tracking_data?.etd || ''}</p>
        </div>
      </div>
      <ol className="relative border-l border-gray-300 ml-2">
        {history.map((entry, idx) => (
          <li key={idx} className="mb-6 ml-4" data-aos="fade-up" data-aos-delay={idx * 100}>
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 border border-white"></div>
            <time className="text-sm text-gray-500">{entry.date}</time>
            <p className="text-gray-800 font-semibold">{entry.activity}</p>
            <p className="text-gray-600 text-sm">{entry.location}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
