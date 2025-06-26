'use client';
import { useState } from 'react';

export default function TestOrderCompletion() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const completeOrder = async () => {
    if (!orderId) {
      alert('Please enter an order ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Test Order Completion
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter order ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={completeOrder}
            disabled={loading || !orderId}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Completing...' : 'Complete Order'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-md">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium">Success!</h3>
                <p className="text-green-700 text-sm mt-1">{result.message}</p>
                {result.order_id && (
                  <p className="text-green-600 text-xs mt-2">
                    Order ID: {result.order_id}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
