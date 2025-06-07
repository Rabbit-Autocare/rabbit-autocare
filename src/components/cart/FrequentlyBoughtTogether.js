"use client";
import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { Package, Plus, ShoppingCart, Percent } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FrequentlyBoughtTogether() {
	const { cartItems } = useCart();
	const [frequentlyBought, setFrequentlyBought] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchComboProducts = useCallback(async () => {
		if (!cartItems || cartItems.length === 0) {
			setFrequentlyBought([]);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			console.log("Component: Fetching combos for cart items:", cartItems);

			const response = await fetch("/api/combos/frequently-bought", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ cartItems }),
			});

			console.log("Component: Response status:", response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Component: API Error:", response.status, errorText);
				throw new Error(`API Error: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			console.log("Component: Received data:", data);

			if (data.error) {
				throw new Error(data.error);
			}

			// Filter out combos that contain products already in cart
			const filteredCombos = (data.combos || []).filter((combo) => {
				const comboProductIds = combo.products.map((p) => p.product_id);
				const cartProductIds = cartItems.map(
					(item) => item.product_id || item.productId || item.id,
				);

				// Only show combos that don't have ALL their products already in cart
				const hasNewProducts = comboProductIds.some(
					(id) => !cartProductIds.includes(id),
				);
				return hasNewProducts;
			});

			console.log("Component: Filtered combos:", filteredCombos);
			setFrequentlyBought(filteredCombos);
		} catch (error) {
			console.error("Component: Error fetching combo products:", error);
			setError(`Failed to load suggestions: ${error.message}`);
			setFrequentlyBought([]);
		} finally {
			setLoading(false);
		}
	}, [cartItems]);

	useEffect(() => {
		console.log("Component: Cart items changed, fetching combos...");
		fetchComboProducts();
	}, [fetchComboProducts]);

	const addComboToCart = async (comboItem) => {
		try {
			const response = await fetch("/api/cart/add", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					productId: comboItem.id,
					quantity: 1,
					isCombo: true,
				}),
			});

			if (response.ok) {
				// You might want to update cart state here instead of reloading
				window.location.reload();
			} else {
				console.error("Failed to add combo to cart");
			}
		} catch (error) {
			console.error("Error adding combo to cart:", error);
		}
	};

	// Calculate savings
	const calculateSavings = (combo) => {
		if (combo.original_price && combo.price) {
			return combo.original_price - combo.price;
		}
		return 0;
	};

	// Don't render if no cart items
	if (!cartItems || cartItems.length === 0) {
		console.log("Component: No cart items, not rendering");
		return null;
	}

	console.log("Component: Rendering with state:", {
		loading,
		error,
		combosCount: frequentlyBought.length,
	});

	return (
		<div className="bg-gray-50 rounded-lg p-4">
			<h4 className="text-sm font-medium flex items-center gap-2 mb-3">
				<ShoppingCart size={16} className="text-green-600" />
				Frequently Bought Together
			</h4>

			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span className="ml-2 text-sm text-gray-600">
						Finding suggestions...
					</span>
				</div>
			) : error ? (
				<div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-red-300">
					<div className="bg-red-100 p-2 rounded-full mb-2">
						<Package size={20} className="text-red-500" />
					</div>
					<p className="text-red-600 text-sm">{error}</p>
					<button
						onClick={fetchComboProducts}
						className="text-red-600 text-xs hover:text-red-800 mt-1 underline"
					>
						Try again
					</button>
				</div>
			) : frequentlyBought.length > 0 ? (
				<div className="space-y-3">
					<p className="text-xs text-gray-600 mb-3">
						Based on items in your cart, customers also bought:
					</p>
					<div className="flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4">
						{frequentlyBought.map((item, index) => {
							const savings = calculateSavings(item);
							return (
								<motion.div
									key={item.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="flex-shrink-0 w-48 border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="relative">
										<div className="relative w-full h-24">
											<Image
												src={item.image_url || "/placeholder.svg"}
												alt={item.name}
												fill
												className="object-cover"
											/>
										</div>
										{savings > 0 && (
											<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
												<Percent size={10} />
												SAVE ₹{savings.toFixed(0)}
											</div>
										)}
										{item.discount_percent && (
											<div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
												{item.discount_percent}% OFF
											</div>
										)}
									</div>
									<div className="p-3">
										<p className="text-sm font-medium mb-2 line-clamp-2 leading-tight">
											{item.name}
										</p>
										{item.description && (
											<p className="text-xs text-gray-500 mb-2 line-clamp-1">
												{item.description}
											</p>
										)}

										{/* Show number of products in combo */}
										<p className="text-xs text-blue-600 mb-2">
											{item.products.length} products included
										</p>

										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-1">
												{item.original_price &&
													item.original_price > item.price && (
														<span className="text-gray-500 text-xs line-through">
															₹{item.original_price}
														</span>
													)}
												<span className="text-sm font-semibold text-green-600">
													₹{item.price}
												</span>
											</div>
										</div>
										<button
											onClick={() => addComboToCart(item)}
											className="w-full bg-black text-white text-xs py-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
										>
											<Plus size={12} />
											ADD COMBO
										</button>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-gray-300">
					<div className="bg-gray-100 p-2 rounded-full mb-2">
						<Package size={20} className="text-gray-500" />
					</div>
					<p className="text-gray-600 text-sm">
						No combo suggestions available
					</p>
					<p className="text-gray-500 text-xs mt-1">
						Add more items to see personalized recommendations
					</p>
				</div>
			)}
		</div>
	);
}
