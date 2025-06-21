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
			// Validate stock availability using StockService
			await StockService.validateOrderStock(transformedItems);

			// Get address details
			const { data: addressData, error: addressError } = await supabase
				.from('addresses')
				.select('*')
				.eq('id', selectedAddressId)
				.single();

			if (addressError) throw addressError;

			// Prepare order items with detailed information
			const orderItems = transformedItems.map(item => {
				const baseItem = {
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					total_price: item.total_price,
					type: item.type
				};

				if (item.type === 'product') {
					return {
						...baseItem,
						product_id: item.product_id,
						product_code: item.product_code,
						variant_id: item.variant?.id,
						variant_details: {
							color: item.variant?.color,
							size: item.variant?.size,
							gsm: item.variant?.gsm,
							quantity: item.variant?.quantity,
							unit: item.variant?.unit
						},
						variant_display_text: item.variant_display_text
					};
				} else if (item.type === 'combo') {
					return {
						...baseItem,
						combo_id: item.combo_id,
						included_products: item.included_products,
						included_variants: item.included_variants
					};
				} else if (item.type === 'kit') {
					return {
						...baseItem,
						kit_id: item.kit_id,
						included_products: item.included_products,
						included_variants: item.included_variants
					};
				}
			});

			// Prepare shipping information
			const shippingInfo = {
				name: addressData.full_name,
				phone: addressData.phone,
				address: addressData.street,
				city: addressData.city,
				state: addressData.state,
				postalCode: addressData.postal_code,
				addressType: addressData.address_type
			};

			const orderData = {
				user_id: userId,
				items: orderItems,
				total: orderTotals.grandTotal,
				subtotal: orderTotals.subtotal,
				status: "pending",
				address_id: selectedAddressId,
				shipping_info: shippingInfo,
				...(coupon && {
					coupon_id: coupon.id,
					coupon_code: coupon.code,
					discount_percent: coupon.value,
					discount_amount: orderTotals.discount,
				}),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			console.log('Placing order with data:', orderData);

			// Insert order
			const { data: orderResult, error: orderError } = await supabase
				.from("orders")
				.insert([orderData])
				.select()
				.single();

			if (orderError) throw orderError;

			// Update stock using StockService
			await StockService.updateStockOnCheckout(transformedItems);

			// Handle coupon usage
			if (coupon) {
				// Insert usage record
				await supabase.from("user_coupons").insert([
					{
						user_id: userId,
						coupon_id: coupon.id,
						order_id: orderResult.id,
						used_at: new Date().toISOString(),
					},
				]);

				// Update usage count
				await supabase
					.from("coupons")
					.rpc("increment_coupon_usage", { coupon_id: coupon.id });
			}

			// Clear cart
			await supabase.from("cart_items").delete().eq("user_id", userId);

			// Clear coupon from context
			clearCoupon();

			// Redirect to confirmation page
			router.push("/confirm");
		} catch (error) {
			console.error("Error placing order:", error);
			alert("Error placing order: " + error.message);
		} finally {
			setLoading(false);
			setShowConfirmModal(false);
		}
	};

	if (cartLoading || loading) {
		return (
			<div className="max-w-7xl mx-auto p-6">
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
					<span className="ml-3">Loading checkout...</span>
				</div>
			</div>
		);
	}

	if (!user) {
		router.push("/login");
		return null;
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-8">Checkout</h1>

			{transformedItems.length === 0 ? (
				<div className="text-center py-12">
					<h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
					<p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout.</p>
					<button
						onClick={() => router.push("/shop")}
						className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
					>
						Continue Shopping
					</button>
				</div>
			) : (
				<div className="grid md:grid-cols-2 gap-6">
					<AddressSection
						userId={userId}
						selectedAddressId={selectedAddressId}
						setSelectedAddressId={setSelectedAddressId}
					/>

					<OrderSummary
						items={transformedItems}
						updateItemQuantity={updateItemQuantity}
						coupon={coupon}
						orderTotals={orderTotals}
						loading={loading}
						onPlaceOrder={() => setShowConfirmModal(true)}
					/>
				</div>
			)}
		</div>
	);
}
