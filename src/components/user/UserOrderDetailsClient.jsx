'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBoxOpen, FaShippingFast, FaTruck, FaCheckCircle } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function UserOrderDetailsClient({ order }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const awbCode = order?.awb_code;

  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!awbCode) return;
      setLoading(true);
      try {
        const res = await axios.get(`/api/track-order/${awbCode}`);
        setTrackingData(res.data?.tracking_data);
      } catch (error) {
        console.error('❌ Failed to fetch tracking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [awbCode]);

  const iconMap = {
    'Order Placed': <FaCheckCircle className="text-blue-500" />,
    'Shipped': <FaTruck className="text-yellow-500" />,
    'Out for Delivery': <FaShippingFast className="text-green-500" />,
    'Delivered': <FaBoxOpen className="text-teal-500" />,
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-[#601e8d]">
        🧾 Order #{order?.order_number}
      </h2>
      <p className="mb-1"><strong>Status:</strong> {order?.status || 'N/A'}</p>
      <p className="mb-1"><strong>Payment:</strong> {order?.payment_method || 'N/A'}</p>

      {awbCode && (
        <div className="mt-8" data-aos="fade-up">
          <h3 className="text-xl font-semibold mb-3">🚚 Shipment Tracking</h3>
          {loading ? (
            <p className="text-gray-500">Fetching tracking info...</p>
          ) : trackingData ? (
            <div className="space-y-2 text-sm">
              <p><strong>Courier:</strong> {trackingData?.courier_name || 'N/A'}</p>
              <p><strong>AWB Code:</strong> {awbCode}</p>
              <p><strong>Current Status:</strong> {trackingData?.current_status || 'N/A'}</p>
              <p><strong>Last Update:</strong> {trackingData?.etd || 'N/A'}</p>

              <div className="mt-6 border-l-4 border-purple-300 pl-4 space-y-5 relative">
                {trackingData?.shipment_track_activities?.map((step, i) => (
                  <div
                    key={i}
                    className="relative"
                    data-aos="fade-up"
                    data-aos-delay={i * 100}
                  >
                    <div className="absolute -left-5 top-1 text-lg">
                      {iconMap[step.status] || <FaCheckCircle className="text-gray-400" />}
                    </div>
                    <p className="text-gray-800 font-medium">
                      {step.status} – <span className="text-gray-600">{step.location}</span>
                    </p>
                    <p className="text-xs text-gray-500">{step.date}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No tracking info available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
