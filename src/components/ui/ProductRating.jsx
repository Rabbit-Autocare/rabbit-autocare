import React from 'react';
import { Star } from 'lucide-react';

// Custom HalfStar SVG
function HalfStar({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="url(#half)"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * ProductRating component
 * @param {Object} props
 * @param {number[]} props.ratings - Array of rating numbers (1-5)
 * @param {number} [props.size=18] - Star icon size
 * @param {boolean} [props.showCount=true] - Whether to show total ratings count
 */
export default function ProductRating({ ratings = [], size = 18, showCount = true }) {
  if (!ratings.length) return null;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const rounded = Math.round(avg * 10) / 10;
  // For stars: round to nearest 0.5
  const display = Math.round(avg * 2) / 2;
  const fullStars = Math.floor(display);
  const hasHalf = display % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={i}
          className="fill-yellow-400 text-yellow-400"
          width={size}
          height={size}
        />
      ))}
      {/* Half star */}
      {hasHalf && <HalfStar size={size} className="text-yellow-400" />}
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={fullStars + i + (hasHalf ? 1 : 0)}
          className="fill-gray-200 text-gray-200"
          width={size}
          height={size}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rounded}</span>
      {showCount && (
        <span className="ml-1 text-xs text-gray-500">({ratings.length})</span>
      )}
    </div>
  );
}
