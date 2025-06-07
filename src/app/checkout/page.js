"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import "@/app/globals.css";

import AddressSection from "@/components/Address/AddressSection";
import OrderSummary from "@/components/checkout-order/OrderSummary";

export default function CheckoutPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const id = searchParams.get("id");
	const productId = searchParams.get("productId");
	const comboId = searchParams.get("comboId");
	const qtyParam = searchParams.get("qty");

	const [userId, setUserId] = useState(null);
	const [product, setProduct] = useState(null);
	const [combo, setCombo] = useState(null);
	const [products, setProducts] = useState([]);
	const [combos, setCombos] = useState([]);
	const [cartItems, setCartItems] = useState([]);
	const [comboCartItems, setComboCartItems] = useState([]);
	const [orderProducts, setOrderProducts] = useState([]);
	const [orderCombos, setOrderCombos] = useState([]);
	const [selectedAddressId, setSelectedAddressId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [appliedCoupon, setAppliedCoupon] = useState(null);

	useEffect(() => {
		const savedCoupon = localStorage.getItem("appliedCoupon");
		if (savedCoupon) {
			try {
				setAppliedCoupon(JSON.parse(savedCoupon));
			} catch (error) {
				console.error("Error parsing saved coupon:", error);
			}
		}
	}, []);

	useEffect(() => {
		getUser();
	}, []);

	const fetchSingleProduct = useCallback(async (id) => {
		try {
			const { data, error } = await supabase
				.from('products')
				.select('*')
				.eq('id', id)
				.single();

			if (error) throw error;
			setCartItems([{ product: data, quantity: parseInt(qtyParam) }]);
		} catch (err) {
			console.error('Error fetching product:', err);
		}
	}, [qtyParam]);

	const fetchSingleCombo = useCallback(async (id) => {
		try {
			const { data, error } = await supabase
				.from('kits_combos')
				.select('*')
				.eq('id', id)
				.single();

			if (error) throw error;
			setCartItems([{ product: data, quantity: parseInt(qtyParam) }]);
		} catch (err) {
			console.error('Error fetching combo:', err);
		}
	}, [qtyParam]);

	const fetchCartData = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from('cart_items')
				.select('*, products(*)')
				.eq('user_id', userId);

			if (error) throw error;
			setCartItems(data);
		} catch (err) {
			console.error('Error fetching cart:', err);
		}
	}, [userId]);

	useEffect(() => {
		const processCheckout = async () => {
			if (productId) {
				await fetchSingleProduct(productId);
			} else if (comboId) {
				await fetchSingleCombo(comboId);
			} else {
				await fetchCartData();
			}
		};

		processCheckout();
	}, [comboId, productId, fetchSingleCombo, fetchSingleProduct, fetchCartData, qtyParam]);

	useEffect(() => {
		if (qtyParam) {
			setQuantity(parseInt(qtyParam));
		}
	}, [qtyParam]);

	const getUser = async () => {
		const { data } = await supabase.auth.getUser();
		if (data?.user) setUserId(data.user.id);
	};

	const updateProductQuantity = (id, qty) => {
		if (qty < 1) return;
		setOrderProducts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
		);
	};

	const getGrandTotal = () => {
		const subtotal = [...orderProducts, ...orderCombos].reduce(
			(acc, item) => acc + item.price * item.quantity,
			0,
		);
		const discountAmount = appliedCoupon
			? (subtotal * appliedCoupon.discount_percent) / 100
			: 0;
		return Math.max(0, subtotal - discountAmount);
	};

	const placeOrder = async () => {
		if (!selectedAddressId || orderProducts.length + orderCombos.length === 0)
			return;
		setLoading(true);

		try {
			const items = [
				...orderProducts.map(({ id, name, price, quantity }) => ({
					product_id: id,
					name,
					price,
					quantity,
				})),
				...orderCombos.map(({ id, name, price, quantity }) => ({
					combo_id: id,
					name,
					price,
					quantity,
				})),
			];

			const subtotal = [...orderProducts, ...orderCombos].reduce(
				(acc, item) => acc + item.price * item.quantity,
				0,
			);
			const orderTotal = getGrandTotal();

			const orderData = {
				user_id: userId,
				items,
				total: orderTotal,
				status: "pending",
				address_id: selectedAddressId,
				...(appliedCoupon && {
					coupon_id: appliedCoupon.id,
					discount_percent: appliedCoupon.discount_percent,
					discount_amount: subtotal - orderTotal,
				}),
			};

			const { data: orderResult, error } = await supabase
				.from("orders")
				.insert([orderData])
				.select();
			if (error) throw error;

			if (appliedCoupon) {
				// Insert usage record
				await supabase.from("user_coupons").insert([
					{
						user_id: userId,
						coupon_id: appliedCoupon.id,
						order_id: orderResult[0].id,
						used_at: new Date().toISOString(),
					},
				]);

				// Also update the usage_count in the coupons table if you want to directly track it there
				await supabase
					.from("coupons")
					.rpc("increment_coupon_usage", { coupon_id: appliedCoupon.id });

				// Clear from localStorage
				localStorage.removeItem("appliedCoupon");
			}

			await supabase.from("cart_items").delete().eq("user_id", userId);
			await supabase.from("combo_cart").delete().eq("user_id", userId);

			if (orderResult) {
				localStorage.removeItem("appliedCoupon");
			}

			router.push("/confirm");
		} catch (error) {
			alert("Error placing order: " + error.message);
		} finally {
			setLoading(false);
			setShowConfirmModal(false);
		}
	};

	useEffect(() => {
		if (product) {
			// Direct product order
			setOrderProducts([{ ...product, quantity: parseInt(qtyParam) }]);
			setOrderCombos([]);
		} else if (combo) {
			// Direct combo order
			setOrderCombos([{ ...combo, quantity: 1 }]);
			setOrderProducts([]);
		} else if (!product && !combo) {
			// Only use cart data if neither product nor combo was provided
			const cartMapped = cartItems
				.map((item) => {
					const p = products.find((pr) => pr.id === item.product_id);
					if (!p) return null;
					const variant = p.variants?.find((v) => v.size === item.variant_size);
					if (!variant) return null;
					return {
						id: p.id,
						name: p.name,
						price: variant.price,
						variant_size: variant.size,
						variant_stock: variant.stock,
						quantity: item.quantity,
					};
				})
				.filter(Boolean);

			const comboMapped = comboCartItems
				.map((item) => {
					const c = combos.find((cb) => cb.id === item.combo_id);
					return c ? { ...c, quantity: item.quantity } : null;
				})
				.filter(Boolean);

			setOrderProducts(cartMapped);
			setOrderCombos(comboMapped);
		}
	}, [product, combo, cartItems, comboCartItems, products, combos, qtyParam]);

	const subtotal = [...orderProducts, ...orderCombos].reduce(
		(acc, item) => acc + item.price * item.quantity,
		0,
	);

	const discount = appliedCoupon
		? Math.round((subtotal * appliedCoupon.discount_percent) / 100)
		: 0;
	const grandTotal = subtotal - discount;

	return (
		<div className="max-w-7xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-8">Checkout</h1>

			<div className="grid md:grid-cols-2 gap-6">
				<AddressSection
					userId={userId}
					selectedAddressId={selectedAddressId}
					setSelectedAddressId={setSelectedAddressId}
				/>

				<OrderSummary
					cartItems={cartItems}
					updateProductQuantity={updateProductQuantity}
					appliedCoupon={appliedCoupon}
					subtotal={subtotal}
					discount={discount}
					grandTotal={grandTotal}
					loading={loading}
					onPlaceOrder={() => setShowConfirmModal(true)}
				/>
			</div>
		</div>
	);
}
