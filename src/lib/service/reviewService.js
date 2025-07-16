export async function fetchReviews({ user_id, product_id, order_id }) {
  const params = new URLSearchParams();
  if (user_id) params.append('user_id', user_id);
  if (product_id) params.append('product_id', product_id);
  if (order_id) params.append('order_id', order_id);
  const res = await fetch(`/api/reviews?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return await res.json();
}

export async function submitReview({ user_id, order_id, product_id, rating, review_text }) {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, order_id, product_id, rating, review_text }),
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return await res.json();
}
