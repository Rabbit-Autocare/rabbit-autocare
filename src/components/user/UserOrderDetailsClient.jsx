'use client';

import { useEffect, useState } from 'react';
import { fetchReviews, submitReview } from '@/lib/service/reviewService';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

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

export default function UserOrderDetailsClient({ order }) {
  const { user, loading: authLoading, sessionChecked } = useAuth();
  const [productReviews, setProductReviews] = useState({});

  useEffect(() => {
    async function loadProductReviews() {
      if (!sessionChecked || !user?.id || !order?.items?.length) return;
      const reviewsMap = {};
      for (const item of order.items) {
        const productId = item.product_id || item.id;
        if (!productId) continue;
        try {
          const reviews = await fetchReviews({
            user_id: user.id,
            order_id: order.id,
            product_id: productId,
          });
          if (reviews && reviews.length > 0) {
            reviewsMap[productId] = {
              review: reviews[0],
              rating: reviews[0].rating,
              reviewText: reviews[0].review_text || '',
              submitted: true,
              loading: false,
            };
          } else {
            reviewsMap[productId] = {
              review: null,
              rating: 0,
              reviewText: '',
              submitted: false,
              loading: false,
            };
          }
        } catch {
          reviewsMap[productId] = {
            review: null,
            rating: 0,
            reviewText: '',
            submitted: false,
            loading: false,
          };
        }
      }
      setProductReviews(reviewsMap);
    }
    loadProductReviews();
  }, [sessionChecked, user?.id, order?.id, order?.items]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleReviewChange = (productId, field, value) => {
    setProductReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (e, item) => {
    e.preventDefault();
    const productId = item.product_id || item.id;
    if (!sessionChecked || !user?.id) {
      alert('You must be logged in to submit a review.');
      return;
    }
    setProductReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], loading: true },
    }));
    try {
      const res = await submitReview({
        user_id: user.id,
        order_id: order.id,
        product_id: productId,
        rating: productReviews[productId].rating,
        review_text: productReviews[productId].reviewText,
      });
      setProductReviews((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          review: res,
          submitted: true,
          loading: false,
        },
      }));
    } catch {
      alert('Failed to submit review.');
      setProductReviews((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], loading: false },
      }));
    }
  };

  // Get shipping address and user info from user_info
  const shippingAddress = order.user_info?.shipping_address;
  const billingAddress = order.user_info?.billing_address;
  const userInfo = order.user_info;

  // Payment type
  const paymentType = order.payment_method || (order.payment_status === 'paid' ? 'Prepaid' : 'Postpaid');

  return (
    <div className="max-w-2xl mx-auto py-8 px-2 sm:px-0">
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Order #{order.order_number}</h2>
          <div className="text-sm text-gray-500 mb-1">Placed on {formatDate(order.created_at)}</div>
          <div className="text-sm text-gray-500 mb-1 capitalize">Status: {order.status || 'Processing'}</div>
        </div>
        {/* User Info */}
        {userInfo && (
          <div className="mb-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900 mb-1">User Info</div>
            <div>Name: {userInfo.full_name || userInfo.name || '-'}</div>
            <div>Email: {userInfo.email || '-'}</div>
          </div>
        )}
        {/* Products */}
        <div className="divide-y divide-gray-100 mb-6">
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => {
              const productId = item.product_id || item.id;
              const reviewState = productReviews[productId] || { rating: 0, reviewText: '', submitted: false, review: null, loading: false };
              return (
                <div key={item.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.main_image_url || (item.images && item.images[0]) || '/placeholder.jpg'}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                      <div className="text-xs text-gray-400">Variant: {item.variant?.variant_display_text || item.variant?.size || '-'}</div>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">₹{item.price}</div>
                  </div>
                  <div className="mt-2">
                    <div className="font-medium text-gray-700 mb-1">Your Review</div>
                    {reviewState.submitted ? (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">You</span>
                          <span className="flex gap-0.5">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className={`text-lg ${star <= reviewState.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">{reviewState.review?.created_at ? formatDate(reviewState.review.created_at) : ''}</span>
                        </div>
                        <div>{reviewState.reviewText || reviewState.review?.review_text}</div>
                        <div className="text-green-600 text-xs mt-2">Thank you for your review!</div>
                      </div>
                    ) : sessionChecked && user ? (
                      <form onSubmit={e => handleReviewSubmit(e, item)} className="space-y-2">
                        <StarRating rating={reviewState.rating} setRating={r => handleReviewChange(productId, 'rating', r)} />
                        <textarea
                          className="w-full border border-gray-200 rounded p-2 text-sm"
                          rows={2}
                          placeholder="Write your review (optional)"
                          value={reviewState.reviewText}
                          onChange={e => handleReviewChange(productId, 'reviewText', e.target.value)}
                        />
                        <button
                          type="submit"
                          className="bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-4 py-1 rounded-full text-sm font-medium"
                          disabled={reviewState.rating === 0 || reviewState.loading}
                        >
                          {reviewState.loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-gray-500 text-center py-4">No items found in this order.</div>
          )}
        </div>
        {/* Order Summary & Address */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Order Summary</div>
            <div>Total: <span className="font-bold">₹{order.total_amount || order.total}</span></div>
            <div>Payment: {paymentType}</div>
            <div>Payment Status: {order.payment_status || '-'}</div>
            <div>Discount: ₹{order.discount_amount || 0}</div>
            <div>Subtotal: ₹{order.subtotal || '-'}</div>
            <div>Delivery Charge: ₹{order.delivery_charge || 0}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Shipping Address</div>
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
            <div className="font-semibold text-gray-900 mt-4 mb-1">Billing Address</div>
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
      </div>
    </div>
  );
}
