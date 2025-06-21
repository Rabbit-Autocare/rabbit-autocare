"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

import "@/app/globals.css";

import AddressSection from "@/components/Address/AddressSection";
import OrderSummary from "@/components/checkout-order/OrderSummary";
import { transformCartForCheckout, calculateOrderTotals, formatPrice } from "@/lib/utils/cartTransformUtils";
import { StockService } from '@/lib/service/stockService';

const getVariantIdsFromItem = async (item) => {
	if (item.type === 'product' && item.variant_id) {
		return [{ variant_id: item.variant_id, quantity: item.quantity }];
	}

	if (item.type === 'kit' || item.type === 'combo') {
		const sourceTable = item.type === 'kit' ? 'kit_products' : 'combo_products';
		const sourceIdColumn = item.type === 'kit' ? 'kit_id' : 'combo_id';
		const sourceId = item.type === 'kit' ? item.kit_id : item.combo_id;

		const { data: relatedItems, error } = await supabase
			.from(sourceTable)
			.select('variant_id, quantity')
			.eq(sourceIdColumn, sourceId);

		if (error) {
			console.error(`Error fetching related items for ${item.type}:`, error);
			return [];
		}

		return relatedItems.map(related => ({
			variant_id: related.variant_id,
			quantity: related.quantity * item.quantity,
		}));
	}
	return [];
};

export default function CheckoutPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { cartItems, coupon, loading: cartLoading, clearCoupon } = useCart();
	const { user } = useAuth();

	const id = searchParams.get("id");
	const productId = searchParams.get("id");
	const comboId = searchParams.get("combo_id");
	const qtyParam = parseInt(searchParams.get("qty")) || 1;

	const [userId, setUserId] = useState(null);
	const [product, setProduct] = useState(null);
	const [combo, setCombo] = useState(null);
	const [transformedItems, setTransformedItems] = useState([]);
	const [selectedAddressId, setSelectedAddressId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [orderTotals, setOrderTotals] = useState({
		subtotal: 0,
		discount: 0,
		discountPercentage: 0,
		grandTotal: 0,
		itemCount: 0,
		totalQuantity: 0
	});

	useEffect(() => {
		if (user) {
			setUserId(user.id);
		}
	}, [user]);

	useEffect(() => {
		if (userId) {
			if (productId) fetchSingleProduct();
			else if (comboId) fetchSingleCombo();
			else transformCartData();
		}
	}, [userId, cartItems]);

	// Recalculate totals when coupon changes
	useEffect(() => {
		if (transformedItems.length > 0) {
			const totals = calculateOrderTotals(transformedItems, coupon);
			setOrderTotals(totals);
		}
	}, [transformedItems, coupon]);

	const getUser = async () => {
		const { data } = await supabase.auth.getUser();
		if (data?.user) setUserId(data.user.id);
	};

	const fetchSingleProduct = async () => {
		try {
			const { data } = await supabase
				.from("products")
				.select("*")
				.eq("id", productId)
				.single();

			if (data) {
				const transformedProduct = {
					id: `direct-${data.id}`,
					type: 'product',
					product_id: data.id,
					product_code: data.product_code,
					name: data.name,
					description: data.description,
					main_image_url: data.main_image_url,
					images: data.images,
					variant: null,
					variant_display_text: 'Default',
					price: data.price,
					quantity: qtyParam,
					total_price: data.price * qtyParam,
					is_microfiber: data.is_microfiber,
					key_features: data.key_features,
					taglines: data.taglines,
					category_name: data.category_name
				};

				setTransformedItems([transformedProduct]);
			}
		} catch (error) {
			console.error("Error fetching single product:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchSingleCombo = async () => {
		try {
			const { data: combo } = await supabase
				.from("combos")
				.select("*")
				.eq("id", comboId)
				.single();

			if (combo) {
				setCombo(combo);
				// Fetch combo products
				const { data: comboProducts } = await supabase
					.from('combo_products')
					.select(`
						*,
						product:products(*)
					`)
					.eq('combo_id', combo.id);

				const transformedCombo = {
					id: `direct-${combo.id}`,
					type: 'combo',
					combo_id: combo.id,
					name: combo.name,
					description: combo.description,
					main_image_url: combo.main_image_url,
					images: combo.images,
					price: combo.price,
					original_price: combo.original_price,
					discount_percentage: combo.discount_percentage,
					quantity: 1,
					total_price: combo.price,
					included_products: comboProducts?.map(cp => ({
						product_id: cp.product_id,
						product_name: cp.product?.name,
						product_code: cp.product?.product_code,
						variant_id: cp.variant_id,
						quantity: cp.quantity
					})) || [],
					included_variants: []
				};

				setTransformedItems([transformedCombo]);
			}
		} catch (error) {
			console.error("Error fetching single combo:", error);
		} finally {
			setLoading(false);
		}
	};

	const transformCartData = async () => {
		if (!cartItems || cartItems.length === 0) {
			setTransformedItems([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const transformed = await transformCartForCheckout(cartItems, userId);
			setTransformedItems(transformed);
		} catch (error) {
			console.error("Error transforming cart data:", error);
			setTransformedItems([]);
		} finally {
			setLoading(false);
		}
	};

	const updateItemQuantity = (itemId, newQuantity) => {
		if (newQuantity < 1) return;

		setTransformedItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, quantity: newQuantity, total_price: item.price * newQuantity }
					: item
			)
		);
	};

	const placeOrder = async () => {
		if (!selectedAddressId || transformedItems.length === 0) {
			alert("Please select an address and ensure you have items in your cart.");
			return;
		}

		setLoading(true);

		try {
			// Step 1: Consolidate all variants from the cart into a single list
			const allVariantsInOrder = (await Promise.all(transformedItems.flatMap(getVariantIdsFromItem))).flat();

			const stockCheckPayload = allVariantsInOrder.map(v => ({
				variant_id: v.variant_id,
				quantity: v.quantity,
			}));

			// Step 2: Check stock for all items at once
			for (const variant of stockCheckPayload) {
				const { data: isAvailable, error } = await supabase.rpc('check_stock_availability', {
					variant_id_input: variant.variant_id,
					quantity_input: variant.quantity,
				});

				if (error || !isAvailable) {
					throw new Error(`Insufficient stock for one or more items. Please review your cart.`);
				}
			}

			// Get address details for shipping info
			const { data: addressData, error: addressError } = await supabase
				.from('addresses')
				.select('*')
				.eq('id', selectedAddressId)
				.single();
			if (addressError) throw addressError;

			// Prepare order data
			const orderData = {
				user_id: userId,
				address_id: selectedAddressId,
				items: transformedItems, // Save the transformed items for order history
				total: orderTotals.grandTotal,
				subtotal: orderTotals.subtotal,
				shipping_info: {
					name: addressData.full_name,
					phone: addressData.phone,
					address: `${addressData.street}, ${addressData.city}, ${addressData.state} - ${addressData.postal_code}`,
				},
				status: 'pending',
				...(coupon && {
					coupon_id: coupon.id,
					discount_amount: orderTotals.discount,
				}),
			};

			// Step 3: Insert the order
			const { data: orderResult, error: orderError } = await supabase
				.from("orders")
				.insert([orderData])
				.select('id')
				.single();
			if (orderError) throw orderError;

			// Step 4: Deduct stock for all items
			await supabase.rpc('deduct_stock_for_order', {
				items_to_deduct: stockCheckPayload,
			});

			// Step 5: Post-order cleanup
			if (coupon) {
				await supabase.from("user_coupons").insert([
					{ user_id: userId, coupon_id: coupon.id, order_id: orderResult.id },
				]);
			}
			await supabase.from("cart_items").delete().eq("user_id", userId);
			clearCoupon();

			router.push("/confirm");
		} catch (error) {
			console.error("Error placing order:", error);
			alert("Error placing order: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	if (cartLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
				<div className="container mx-auto px-4 py-8">
					<div className="flex items-center justify-center h-96">
						<div className="text-center">
							<div className="relative">
								<div className="w-20 h-20 mx-auto mb-6">
									<div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
									<div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
										<div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
									</div>
								</div>
							</div>
							<h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Checkout</h2>
							<p className="text-gray-600">Preparing your order details...</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!user) {
		router.push("/login");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
			{/* Header Section */}
			<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
				<div className="container mx-auto px-4 py-8">
					<div className="text-center text-white">
						<div className="flex items-center justify-center gap-4 mb-4">
							<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">🛒</span>
							</div>
							<h1 className="text-4xl md:text-5xl font-bold">
								Secure Checkout
							</h1>
						</div>
						<p className="text-indigo-100 text-lg max-w-2xl mx-auto">
							Complete your purchase with our secure and streamlined checkout process
						</p>
					</div>
				</div>
			</div>

			{/* Breadcrumb */}
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<button 
						onClick={() => router.push("/shop")}
						className="hover:text-indigo-600 transition-colors"
					>
						Shop
					</button>
					<span className="text-gray-400">→</span>
					<button 
						onClick={() => router.push("/cart")}
						className="hover:text-indigo-600 transition-colors"
					>
						Cart
					</button>
					<span className="text-gray-400">→</span>
					<span className="text-indigo-600 font-medium">Checkout</span>
				</div>
			</div>

			<div className="container mx-auto px-4 pb-12">
				{transformedItems.length === 0 ? (
					<div className="max-w-2xl mx-auto">
						<div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-200">
							<div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
								<span className="text-4xl">🛒</span>
							</div>
							<h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
							<p className="text-gray-600 text-lg mb-8 leading-relaxed">
								Looks like you havent added any items to your cart yet. 
								Discover our amazing products and start shopping!
							</p>
							<button
								onClick={() => router.push("/shop")}
								className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
							>
								<span className="flex items-center gap-3">
									<span>🛍️</span>
									<span>Continue Shopping</span>
								</span>
							</button>
						</div>
					</div>
				) : (
					<div className="max-w-7xl mx-auto">
						{/* Progress Indicator */}
						<div className="mb-8">
							<div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
								<div className="flex items-center justify-center gap-8">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
											✓
										</div>
										<span className="font-medium text-gray-700">Cart Review</span>
									</div>
									<div className="w-16 h-1 bg-gradient-to-r from-green-500 to-indigo-500 rounded-full"></div>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
											2
										</div>
										<span className="font-medium text-indigo-600">Checkout</span>
									</div>
									<div className="w-16 h-1 bg-gray-200 rounded-full"></div>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
											3
										</div>
										<span className="font-medium text-gray-500">Confirmation</span>
									</div>
								</div>
							</div>
						</div>

						{/* Main Checkout Content */}
						<div className="grid lg:grid-cols-5 gap-8">
							{/* Address Section - Left Side */}
							<div className="lg:col-span-3">
								<div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
									<div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
										<h2 className="text-2xl font-bold flex items-center gap-3">
											<span className="text-2xl">📍</span>
											Delivery Address
										</h2>
										<p className="text-indigo-100 mt-2">Where should we deliver your order?</p>
									</div>
									<div className="p-6">
										<AddressSection
											userId={userId}
											selectedAddressId={selectedAddressId}
											setSelectedAddressId={setSelectedAddressId}
										/>
									</div>
								</div>
							</div>

							{/* Order Summary - Right Side */}
							<div className="lg:col-span-2">
								<div className="sticky top-6">
									<OrderSummary
										items={transformedItems}
										updateItemQuantity={updateItemQuantity}
										coupon={coupon}
										orderTotals={orderTotals}
										loading={loading}
										onPlaceOrder={() => setShowConfirmModal(true)}
									/>

									{/* Security Badges */}
									<div className="mt-6 bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
										<div className="text-center">
											<h3 className="font-semibold text-gray-800 mb-3">Secure Checkout</h3>
											<div className="flex justify-center items-center gap-4 text-sm text-gray-600">
												<div className="flex items-center gap-2">
													<span className="text-green-500">🔒</span>
													<span>SSL Encrypted</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-blue-500">🛡️</span>
													<span>Safe & Secure</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Confirmation Modal */}
			{showConfirmModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform scale-100 transition-all duration-300">
						<div className="text-center">
							<div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
								<span className="text-3xl text-white">🛒</span>
							</div>
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Your Order</h3>
							<p className="text-gray-600 mb-6 leading-relaxed">
								Are you sure you want to place this order? This action cannot be undone.
							</p>
							<div className="flex gap-4">
								<button
									onClick={() => setShowConfirmModal(false)}
									className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={placeOrder}
									disabled={loading}
									className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 transition-all duration-300"
								>
									{loading ? "Processing..." : "Confirm Order"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}