'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';
import Image from 'next/image';
import { fetchReviews, submitReview } from '@/lib/service/reviewService';
import { useAuth } from '@/contexts/AuthContext';

const statusColors = {
  delivered: 'text-green-600',
  shipped: 'text-blue-600',
  processing: 'text-yellow-500',
  cancelled: 'text-red-500',
};

function getStatusColor(status) {
  if (!status) return 'text-gray-400';
  return statusColors[status.toLowerCase()] || 'text-gray-400';
}

function StarRating({ rating, setRating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => setRating(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function UserOrdersClient({ initialOrders }) {
  const router = useRouter();
  const { user, loading: authLoading, sessionChecked } = useAuth();
  const [reviewRatings, setReviewRatings] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState({});

  // Fetch existing ratings for orders on mount or when user/sessionChecked changes
  useEffect(() => {
    async function loadOrderRatings() {
      if (!sessionChecked || !user?.id || !initialOrders?.length) return;
      const ratings = {};
      const submittedMap = {};
      for (const order of initialOrders) {
        const productId = order.items?.[0]?.product_id || order.items?.[0]?.product?.id;
        if (!productId) continue;
        try {
          const reviews = await fetchReviews({
            user_id: user.id,
            order_id: order.id,
            product_id: productId,
          });
          if (reviews && reviews.length > 0) {
            ratings[order.id] = reviews[0].rating;
            submittedMap[order.id] = true;
          }
        } catch {}
      }
      setReviewRatings(ratings);
      setSubmitted(submittedMap);
    }
    loadOrderRatings();
  }, [sessionChecked, user?.id, initialOrders]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSetRating = (orderId, rating) => {
    setReviewRatings((prev) => ({ ...prev, [orderId]: rating }));
  };

  const handleSubmitRating = async (order) => {
    if (!sessionChecked || !user?.id) {
      alert('You must be logged in to submit a review.');
      return;
    }
    setLoading((prev) => ({ ...prev, [order.id]: true }));
    try {
      await submitReview({
        user_id: user.id,
        order_id: order.id,
        product_id: order.items[0]?.product_id || order.items[0]?.product?.id,
        rating: reviewRatings[order.id],
        review_text: '',
      });
      setSubmitted((prev) => ({ ...prev, [order.id]: true }));
    } catch (err) {
      alert('Failed to submit review.');
    } finally {
      setLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto py-8 px-2 sm:px-0">
        <h1 className="text-xl font-semibold mb-6 border-l-4 border-[#601e8d] pl-2">Order History</h1>
        {initialOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center shadow-none">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Orders Yet</h3>
            <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => router.push('/shop')}
              className="bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {initialOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-100 p-4 mb-2"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-semibold ${getStatusColor(order.status)}`}>{order.status || 'Processing'}</span>
                  <span className="text-gray-400 text-sm">{formatDate(order.created_at)}</span>
                  <button
                    onClick={() => router.push(`/user/orders/${order.id}`)}
                    className="text-xl text-gray-500 hover:text-[#601e8d]"
                    aria-label="View order details"
                  >
                    &gt;
                  </button>
                </div>
                {order.items && order.items[0] && (
                  <div className="flex items-center gap-4 mb-2">
                    <Image
                      src={order.items[0].main_image_url || order.items[0].images?.[0] || '/placeholder.jpg'}
                      alt={order.items[0].name}
                      width={56}
                      height={56}
                      className="object-cover w-14 h-14 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{order.items[0].name}</div>
                      <div className="text-sm text-gray-500">Quantity: {order.items[0].quantity}</div>
                      <div className="text-sm text-gray-500">Price: ₹{order.items[0].price}</div>
                    </div>
                  </div>
                )}
                {/* Only show review UI if sessionChecked and user is present */}
                {sessionChecked && user && (
                  <div className="mt-2">
                    <div className="font-medium text-gray-700 mb-1">Leave a Review</div>
                    <StarRating
                      rating={reviewRatings[order.id] || 0}
                      setRating={(rating) => handleSetRating(order.id, rating)}
                    />
                    {reviewRatings[order.id] > 0 && !submitted[order.id] && (
                      <button
                        className="mt-2 bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-4 py-1 rounded-full text-sm font-medium"
                        onClick={() => handleSubmitRating(order)}
                        disabled={loading[order.id]}
                      >
                        {loading[order.id] ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    )}
                    {submitted[order.id] && (
                      <div className="text-green-600 text-sm mt-2">Thank you for your rating!</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
