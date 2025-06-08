"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Plus, Minus, ShoppingCart, Heart } from "lucide-react";

export default function ProductDetail({ product, onAddToCart }) {
	const [activeImageIndex, setActiveImageIndex] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [isAddingToCart, setIsAddingToCart] = useState(false);

	// Get all product images
	const images = product?.images || [];

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
			console.log("Adding to cart with variant:", selectedVariant); // Debug log
			await onAddToCart({
				productId: product.id,
				variantId: selectedVariant.id,
				quantity: quantity,
				price: selectedVariant.price,
				size: selectedVariant.size_cm || selectedVariant.size, // Updated to use size_cm
				color: selectedVariant.color,
				gsm: selectedVariant.gsm,
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
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			{/* Product Images */}
			<div className="space-y-4">
				{/* Main Image */}
				<div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
					{images[activeImageIndex] ? (
						<Image
							src={getImageUrl(images[activeImageIndex])}
							alt={product.name}
							fill
							className="object-contain p-4"
							unoptimized={!images[activeImageIndex].startsWith("http")}
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
								<span className="text-gray-500">No Image</span>
							</div>
						</div>
					)}
				</div>

				{/* Thumbnail Images */}
				{images.length > 1 && (
					<div className="grid grid-cols-4 gap-2">
						{images.map((image, index) => (
							<button
								key={index}
								onClick={() => setActiveImageIndex(index)}
								className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
									activeImageIndex === index
										? "border-blue-500"
										: "border-transparent"
								}`}
							>
								<Image
									src={getImageUrl(image)}
									alt={`${product.name} - Image ${index + 1}`}
									fill
									className="object-contain p-2"
									unoptimized={!image.startsWith("http")}
								/>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Product Info */}
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
					<div className="space-y-4">
						{/* Size Selection */}
						{product.variants.some((v) => v.size_cm || v.size) && (
							<div>
								<h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
								<div className="flex flex-wrap gap-2">
									{[...new Set(product.variants.map((v) => v.size_cm || v.size))].map(
										(size) => {
											const variant = product.variants.find(
												(v) => (v.size_cm || v.size) === size
											);
											return (
												<button
													key={size}
													onClick={() =>
														setSelectedVariant(
															product.variants.find(
																(v) =>
																	(v.size_cm || v.size) === size &&
																	v.color === selectedVariant?.color
															) || variant
														)
													}
													className={`px-4 py-2 border rounded-md text-sm font-medium ${
														(selectedVariant?.size_cm || selectedVariant?.size) === size
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-300 text-gray-700 hover:bg-gray-50"
													}`}
												>
													{size}
												</button>
											);
										}
									)}
								</div>
							</div>
						)}

						{/* Color Selection */}
						{product.variants.some((v) => v.color) && (
							<div>
								<h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
								<div className="flex flex-wrap gap-2">
									{[...new Set(product.variants.map((v) => v.color))].map(
										(color) => {
											const variant = product.variants.find(
												(v) => v.color === color
											);
											return (
												<button
													key={color}
													onClick={() =>
														setSelectedVariant(
															product.variants.find(
																(v) =>
																	v.color === color &&
																	(v.size_cm || v.size) === (selectedVariant?.size_cm || selectedVariant?.size)
															) || variant
														)
													}
													className={`px-4 py-2 border rounded-md text-sm font-medium ${
														selectedVariant?.color === color
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-300 text-gray-700 hover:bg-gray-50"
													}`}
												>
													{color}
												</button>
											);
										}
									)}
								</div>
							</div>
						)}

						{/* GSM Selection */}
						{product.variants.some((v) => v.gsm) && (
							<div>
								<h3 className="text-sm font-medium text-gray-900 mb-2">GSM</h3>
								<div className="flex flex-wrap gap-2">
									{[...new Set(product.variants.map((v) => v.gsm))].map(
										(gsm) => {
											const variant = product.variants.find(
												(v) => v.gsm === gsm
											);
											return (
												<button
													key={gsm}
													onClick={() =>
														setSelectedVariant(
															product.variants.find(
																(v) =>
																	v.gsm === gsm &&
																	v.size === selectedVariant?.size &&
																	v.color === selectedVariant?.color
															) || variant
														)
													}
													className={`px-4 py-2 border rounded-md text-sm font-medium ${
														selectedVariant?.gsm === gsm
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-300 text-gray-700 hover:bg-gray-50"
													}`}
												>
													{gsm} GSM
												</button>
											);
										}
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Quantity and Add to Cart */}
				<div className="flex items-center gap-4">
					<div className="flex items-center border border-gray-300 rounded-md">
						<button
							onClick={() => handleQuantityChange(-1)}
							className="px-3 py-2 text-gray-600 hover:bg-gray-50"
							disabled={quantity <= 1}
						>
							<Minus size={16} />
						</button>
						<span className="px-4 py-2 text-gray-900">{quantity}</span>
						<button
							onClick={() => handleQuantityChange(1)}
							className="px-3 py-2 text-gray-600 hover:bg-gray-50"
							disabled={
								!selectedVariant || quantity >= selectedVariant.stock
							}
						>
							<Plus size={16} />
						</button>
					</div>

					<button
						onClick={handleAddToCart}
						disabled={!selectedVariant || isAddingToCart}
						className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isAddingToCart ? (
							"Adding..."
						) : !selectedVariant ? (
							"Select Options"
						) : (
							<>
								<ShoppingCart size={20} className="inline-block mr-2" />
								Add to Cart
							</>
						)}
					</button>

					<button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50">
						<Heart size={20} className="text-gray-600" />
					</button>
				</div>

				{/* Stock Status */}
				{selectedVariant && (
					<div className="text-sm text-gray-600">
						{selectedVariant.stock > 0 ? (
							<span className="text-green-600">
								In Stock ({selectedVariant.stock} available)
							</span>
						) : (
							<span className="text-red-600">Out of Stock</span>
						)}
					</div>
				)}

				{/* Key Features */}
				{product.key_features && product.key_features.length > 0 && (
					<div className="mt-6">
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Key Features
						</h3>
						<ul className="list-disc list-inside space-y-1 text-gray-600">
							{product.key_features.map((feature, index) => (
								<li key={index}>{feature}</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
