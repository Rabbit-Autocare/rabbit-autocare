import { useState } from 'react';
import { PaymentService } from '@/lib/service/paymentService';

export default function RetryPayment({ order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRetryPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create new Razorpay order
      const razorpayOrder = await PaymentService.createRazorpayOrder({
        amount: order.total,
        receipt: order.order_number,
        order_id: order.id,
      });

      // Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Rabbit Auto Care',
        description: `Order #${order.order_number} (Retry)`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Verify payment
            const result = await PaymentService.verifyPayment({
              ...response,
              order_id: order.id,
            });

            if (result.success) {
              // Payment succeeded
              if (onSuccess) onSuccess();
            } else {
              setError('Payment verification failed. Please try again.');
            }
          } catch (err) {
            setError('Error processing payment. Please try again.');
            console.error('Payment handler error:', err);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: order.user_info?.shipping_address?.name || '',
          email: order.user_info?.email || '',
          contact: order.user_info?.shipping_address?.phone || '',
        },
        theme: {
          color: '#601E8D',
        },
      };

      // Initialize Razorpay
      const rzp = PaymentService.initializeRazorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Retry payment error:', error);
      setError(error.message || 'Failed to retry payment');
      setLoading(false);
    }
  };

  return (
    <div className='mt-4'>
      {error && (
        <div className='mb-3 text-sm text-red-600 bg-red-50 p-2 rounded'>
          {error}
        </div>
      )}
      <button
        onClick={handleRetryPayment}
        disabled={loading}
        className='bg-[#601E8D] hover:bg-[#4a1770] text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors'
      >
        {loading ? 'Processing...' : 'Retry Payment'}
      </button>
    </div>
  );
}
