"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/lib/service/productService";
import ProductDetail from "@/components/shop/ProductDetail";

export default function ProductPage({ params }) {
	const [productId, setProductId] = useState(null);
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Handle params resolution for Next.js 15+
	useEffect(() => {
		async function resolveParams() {
			try {
				// Handle both Promise and direct object cases
				const resolvedParams = await Promise.resolve(params);
				const id = resolvedParams?.id;

				if (!id) {
					setError("Invalid product ID");
					setLoading(false);
					return;
				}

				setProductId(id);
			} catch (err) {
				console.error("Error resolving params:", err);
				setError("Invalid product ID");
				setLoading(false);
			}
		}

		resolveParams();
	}, [params]);

	// Fetch product data
	useEffect(() => {
		async function fetchProduct() {
			if (!productId) return;

			try {
				setLoading(true);
				setError(null);

				console.log("Fetching product with ID:", productId); // Debug log

				// Use ProductService to fetch the product
				const response = await ProductService.getProduct(productId);

				console.log("Product service response:", response); // Debug log

				if (response.success && response.product) {
					// Format product for display
					const formattedProduct = ProductService.formatProductForDisplay(
						response.product,
					);
					setProduct(formattedProduct);
				} else {
					throw new Error(response.error || "Product not found");
				}
			} catch (err) {
				console.error("Error fetching product:", err);
				setError(
					err.message || "Could not load the product. Please try again.",
				);
			} finally {
				setLoading(false);
			}
		}

		fetchProduct();
	}, [productId]);

	// Handle add to cart functionality
	const handleAddToCart = async (cartItem) => {
		try {
			// Get the first available image
			const productImage = product?.images?.[0] || product?.image?.[0] || null;

			const response = await fetch("/api/cart/add", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					productId: cartItem.productId,
					variantId: cartItem.variantId,
					quantity: cartItem.quantity,
					price: cartItem.price,
					variant: cartItem.size || cartItem.color || "default",
					productName: product.name,
					productImage: productImage,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				alert("Product added to cart successfully!");
			} else {
				throw new Error(data.error || "Failed to add to cart");
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			throw error;
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex justify-center items-center min-h-[400px]">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
				</div>
			</div>
		);
	}

	if (error || !product) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
						<div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
							<svg
								className="w-6 h-6 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
						<p className="text-red-600 mb-2">{error || "Product not found"}</p>
						<p className="text-sm text-red-500 mb-4">
							Product ID: {productId || "Unknown"}
						</p>
						<button
							onClick={() => window.history.back()}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
						>
							Go Back
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
				<a href="/" className="hover:text-gray-700">
					Home
				</a>
				<span>/</span>
				<a href="/shop/all" className="hover:text-gray-700">
					Shop
				</a>
				<span>/</span>
				<span className="text-gray-700">{product.name}</span>
			</nav>

			{/* Product Detail Component */}
			<ProductDetail product={product} onAddToCart={handleAddToCart} />
		</div>
	);
}
