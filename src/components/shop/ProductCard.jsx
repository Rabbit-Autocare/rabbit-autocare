"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

const ProductCard = ({ product }) => {
	const router = useRouter();
	const [hasImageError, setHasImageError] = useState(false);

	const handleImageError = () => {
		setHasImageError(true);
	};

	// Calculate min and max prices from variants
	const prices = product.variants?.map((v) => v.price) || [];
	const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

	// Get the first image URL from product images or use the image field
	const rawImageUrl =
		product.image ||
		(product.images && product.images.length > 0 ? product.images[0] : null);

	// Validate and sanitize the image URL
	const getValidImageUrl = (url) => {
		if (!url) return null;

		try {
			// If it's already a valid absolute URL, return it
			new URL(url);
			return url;
		} catch {
			// If it's a relative URL or invalid, try to make it absolute
			if (typeof url === "string" && url.trim()) {
				// If it starts with /, treat as absolute path
				if (url.startsWith("/")) {
					return url;
				}
				// If it doesn't start with http/https, assume it's a relative path
				if (!url.startsWith("http")) {
					return `/${url}`;
				}
			}
			return null;
		}
	};

	const imageUrl = getValidImageUrl(rawImageUrl);

	// Get the number of ratings (placeholder for now)
	const ratingCount =
		product.reviews?.length || Math.floor(Math.random() * 20) + 1;

	return (
		<div className="bg-white rounded overflow-hidden relative group">
			{/* Wishlist button */}
			<button
				className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					// Add wishlist functionality here
				}}
			>
				<Heart size={16} className="text-gray-600" />
			</button>

			{/* Product Image */}
			<div
				className="relative h-64 w-full bg-gray-100 cursor-pointer"
				onClick={() => router.push(`/products/${product.id}`)}
			>
				{imageUrl && !hasImageError ? (
					<Image
						src={imageUrl}
						alt={product.name}
						fill
						className="object-contain p-4"
						onError={handleImageError}
						unoptimized={!imageUrl.startsWith("http")} // Disable optimization for local images if needed
					/>
				) : (
					<div className="flex items-center justify-center h-full bg-gray-100">
						<div className="text-center">
							<svg
								className="w-16 h-16 text-gray-400 mx-auto mb-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span className="text-gray-500 text-sm">No Image</span>
						</div>
					</div>
				)}
			</div>

			{/* Product Details */}
			<div className="p-3">
				{/* Product Name */}
				<h3
					className="text-base font-medium text-gray-800 mb-1 cursor-pointer"
					onClick={() => router.push(`/products/${product.id}`)}
				>
					{product.name}
				</h3>

				{/* Star Ratings */}
				<div className="flex items-center mb-1">
					<div className="flex items-center">
						{[1, 2, 3, 4, 5].map((star) => (
							<svg
								key={star}
								className="w-3 h-3 text-yellow-400 fill-current"
								viewBox="0 0 20 20"
							>
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						))}
						<span className="ml-1 text-xs text-gray-500">{`| ${ratingCount} Rating${ratingCount !== 1 ? "s" : ""}`}</span>
					</div>
				</div>

				{/* Product Description */}
				<p className="text-xs text-gray-600 mb-2 line-clamp-2">
					{product.description || "Used to clean windshields etc."}
				</p>
				<hr className="border-gray-600 mb-2" />
				{/* Price */}
				<p className="text-base font-bold text-gray-800 mb-2">₹{minPrice}</p>

				{/* Add to Cart Button */}
				<button
					className="w-full bg-white border border-gray-300 text-gray-800 py-1.5 px-4 rounded text-sm hover:bg-gray-50 transition-colors duration-300"
					onClick={() => router.push(`/products/${product.id}`)}
				>
					Add to Cart
				</button>
			</div>
		</div>
	);
};

export default ProductCard;
