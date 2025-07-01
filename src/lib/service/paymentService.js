import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

export const PaymentService = {
  /**
   * Create a Razorpay order
   * @param {Object} options - Order options
   * @returns {Promise<Object>} Razorpay order
   */
  async createRazorpayOrder({ amount, currency = 'INR', receipt, order_id }) {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          receipt,
          order_id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      return data;
    } catch (error) {
      console.error('Payment service - Create order error:', error);
      throw error;
    }
  },

  /**
   * Verify a Razorpay payment
   * @param {Object} paymentDetails - Razorpay payment details
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(paymentDetails) {
    try {
      const response = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails),
      });

      return await response.json();
    } catch (error) {
      console.error('Payment service - Verify payment error:', error);
      throw error;
    }
  },

  /**
   * Update order status after payment
   * @param {string} orderId - Supabase order ID
   * @param {string} status - New status
   * @param {string} paymentStatus - New payment status
   * @param {Object} paymentDetails - Additional payment details
   */
  async updateOrderStatus(orderId, status, paymentStatus, paymentDetails = {}) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          payment_status: paymentStatus,
          ...paymentDetails,
          payment_updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Payment service - Update order status error:', error);
      throw error;
    }
  },

  /**
   * Record a failed payment
   * @param {string} orderId - Supabase order ID
   * @param {Object} error - Error details
   */
  async recordFailedPayment(orderId, error) {
    return this.updateOrderStatus(orderId, 'payment_failed', 'failed', {
      payment_error: JSON.stringify(error),
      payment_attempted_at: new Date().toISOString(),
    });
  },

  /**
   * Initialize Razorpay checkout
   * @param {Object} options - Razorpay options
   * @returns {Object} Razorpay instance
   */
  initializeRazorpay(options) {
    if (typeof window === 'undefined' || !window.Razorpay) {
      throw new Error('Razorpay is not loaded');
    }

    return new window.Razorpay(options);
  },
};

export default PaymentService;
