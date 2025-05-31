"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Plus, Minus, ShoppingCart, Heart } from "lucide-react";

export default function ProductDetail({ product, onAddToCart }) {
	const [activeImageIndex, setActiveImageIndex] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [isAddingToCart, setIsAddingToCart] = useState(false);

	// Get all product images - handle both 'images' and 'image' properties
	const images = product?.images || product?.image || [];

	// Set default selected variant
	useEffect(() => {
		if (product?.variants && product.variants.length > 0 && !selectedVariant) {
			setSelectedVariant(product.variants[0]);
		}
	}, [product?.variants, selectedVariant]);

	// Helper to get valid image URL
	const getImageUrl = (imagePath) => {
		if (!imagePath) return "/images/placeholder.png";

		try {
			// If it's already a valid absolute URL, return it
			new URL(imagePath);
			return imagePath;
		} catch {
			// If it's a relative URL, make it absolute
			if (typeof imagePath === "string" && imagePath.trim()) {
				// If it's a path to Supabase storage
				if (!imagePath.startsWith("http") && !imagePath.startsWith("/")) {
					return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
				}
				// If it starts with /, treat as absolute path
				if (imagePath.startsWith("/")) {
					return imagePath;
				}
			}
			return "/images/placeholder.png";
		}
	};

	// Handle quantity change
	const handleQuantityChange = (change) => {
		const newQuantity = quantity + change;
		if (
			newQuantity >= 1 &&
			(!selectedVariant || newQuantity <= selectedVariant.stock)
		) {
			setQuantity(newQuantity);
		}
	};

	// Handle add to cart
	const handleAddToCart = async () => {
		if (!selectedVariant) {
			alert("Please select a product variant");
			return;
		}

		if (selectedVariant.stock <= 0) {
			alert("This variant is out of stock");
			return;
		}

		if (quantity > selectedVariant.stock) {
			alert(`Only ${selectedVariant.stock} items available`);
			return;
		}

		setIsAddingToCart(true);
		try {
			await onAddToCart({
				productId: product.id,
				variantId: selectedVariant.id,
				quantity: quantity,
				price: selectedVariant.price,
				size: selectedVariant.size,
				color: selectedVariant.color,
			});
		} catch (error) {
			console.error("Error adding to cart:", error);
			alert("Failed to add to cart. Please try again.");
		} finally {
			setIsAddingToCart(false);
		}
	};

	// Render star rating
	const renderStars = (rating) => {
		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < 5; i++) {
			if (i < fullStars) {
				stars.push(
					<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />,
				);
			} else if (i === fullStars && hasHalfStar) {
				stars.push(
					<div key={i} className="relative">
						<Star className="w-5 h-5 text-gray-300" />
						<div className="absolute inset-0 overflow-hidden w-1/2">
							<Star className="w-5 h-5 text-yellow-400 fill-current" />
						</div>
					</div>,
				);
			} else {
				stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
			}
		}
		return stars;
	};

	if (!product) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<p className="text-gray-500">Product not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid md:grid-cols-2 gap-8">
			{/* Left: Image Gallery */}
			<div className="space-y-4">
				{/* Main Image */}
				<div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
					{images.length > 0 ? (
						<Image
							src={getImageUrl(images[activeImageIndex])}
							alt={product.name}
							fill
							className="object-contain p-4"
							unoptimized
						/>
					) : (
						<div className="flex items-center justify-center h-full">
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
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-gray-500">No Image Available</span>
							</div>
						</div>
					)}
				</div>

				{/* Thumbnail Gallery */}
				{images.length > 1 && (
					<div className="flex flex-wrap gap-2">
						{images.map((img, index) => (
							<button
								key={index}
								className={`relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden ${
									activeImageIndex === index ? "ring-2 ring-blue-500" : ""
								}`}
								onClick={() => setActiveImageIndex(index)}
							>
								<Image
									src={getImageUrl(img)}
									alt={`${product.name} - view ${index + 1}`}
									fill
									className="object-cover"
									unoptimized
								/>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Right: Product Details */}
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						{product.name}
					</h1>

					{/* Rating and Reviews */}
					<div className="flex items-center mb-4">
						<div className="flex mr-2">
							{renderStars(product.averageRating || 0)}
						</div>
						<span className="text-sm text-gray-500">
							({product.reviews?.length || 0} Reviews)
						</span>
					</div>
				</div>

				{/* Price Display */}
				<div className="mb-6">
					{selectedVariant ? (
						<div className="flex items-center gap-4">
							<span className="text-3xl font-bold text-gray-900">
								₹{selectedVariant.price}
							</span>
							{selectedVariant.compareAtPrice &&
								selectedVariant.compareAtPrice > selectedVariant.price && (
									<span className="text-xl text-gray-500 line-through">
										₹{selectedVariant.compareAtPrice}
									</span>
								)}
						</div>
					) : (
						<div className="text-2xl font-bold text-gray-900">
							{product.variants && product.variants.length > 0 && (
								<>
									₹{Math.min(...product.variants.map((v) => v.price))} - ₹
									{Math.max(...product.variants.map((v) => v.price))}
								</>
							)}
						</div>
					)}
				</div>

				{/* Description */}
				<div className="mb-6">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Description
					</h3>
					<p className="text-gray-600 leading-relaxed">{product.description}</p>
				</div>

				{/* Variants Selection */}
				{product.variants && product.variants.length > 0 && (
					<div className="mb-6">
						<h3 className="text-lg font-medium text-gray-900 mb-3">
							Available Options
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{product.variants.map((variant) => (
								<button
									key={variant.id}
									className={`border rounded-lg p-4 text-left transition-colors ${
										selectedVariant?.id === variant.id
											? "border-blue-500 bg-blue-50"
											: "border-gray-200 hover:border-gray-300"
									} ${variant.stock <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
									onClick={() => {
										if (variant.stock > 0) {
											setSelectedVariant(variant);
											setQuantity(1); // Reset quantity when variant changes
										}
									}}
									disabled={variant.stock <= 0}
								>
									<div className="flex justify-between items-start mb-1">
										<span className="font-medium text-gray-900">
											{variant.size ||
												variant.color ||
												variant.value ||
												`Option ${variant.id}`}
										</span>
										<span className="font-bold text-gray-900">
											₹{variant.price}
										</span>
									</div>
									<div className="text-sm text-gray-500">
										{variant.stock > 0
											? `${variant.stock} in stock`
											: "Out of stock"}
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Quantity and Add to Cart */}
				{selectedVariant && selectedVariant.stock > 0 && (
					<div className="space-y-4">
						{/* Quantity Selector */}
						<div className="flex items-center gap-4">
							<span className="text-sm font-medium text-gray-900">
								Quantity:
							</span>
							<div className="flex items-center border border-gray-300 rounded-lg">
								<button
									onClick={() => handleQuantityChange(-1)}
									disabled={quantity <= 1}
									className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Minus size={16} />
								</button>
								<span className="px-4 py-2 text-center min-w-[60px]">
									{quantity}
								</span>
								<button
									onClick={() => handleQuantityChange(1)}
									disabled={quantity >= selectedVariant.stock}
									className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Plus size={16} />
								</button>
							</div>
							<span className="text-sm text-gray-500">
								({selectedVariant.stock} available)
							</span>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={handleAddToCart}
								disabled={
									isAddingToCart ||
									!selectedVariant ||
									selectedVariant.stock <= 0
								}
								className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								<ShoppingCart size={20} />
								{isAddingToCart ? "Adding..." : "Add to Cart"}
							</button>

							<button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
								<Heart size={20} className="text-gray-600" />
							</button>
						</div>
					</div>
				)}

				{/* Out of Stock Message */}
				{selectedVariant && selectedVariant.stock <= 0 && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<p className="text-red-800 font-medium">
							This variant is currently out of stock
						</p>
					</div>
				)}

				{/* No Variants Available */}
				{(!product.variants || product.variants.length === 0) && (
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<p className="text-gray-800">
							This product is currently unavailable
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
