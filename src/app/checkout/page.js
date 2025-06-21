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
