import { useEffect, useState } from 'react';
import { fetchReviews } from '@/lib/service/reviewService';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await fetchReviews({});
        setReviews(data);
      } catch (err) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  if (loading) return <div className="py-10 text-center">Loading reviews...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">All User Reviews</h1>
      {reviews.length === 0 ? (
        <div className="text-gray-500 text-center">No reviews found.</div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-4 mb-2">
                {review.product?.main_image_url && (
                  <img src={review.product.main_image_url} alt={review.product.name} className="w-14 h-14 object-cover rounded" />
                )}
                <div>
                  <div className="font-semibold text-gray-900">{review.product?.name || 'Product'}</div>
                  <div className="text-xs text-gray-400">Order #{review.order_id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Rating:</span>
                <span className="flex gap-0.5">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </span>
                <span className="text-xs text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              {review.review_text && <div className="text-gray-700 text-sm mt-1">{review.review_text}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
