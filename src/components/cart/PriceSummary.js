"use client";
import { useCart } from "@/hooks/useCart";

export default function PriceSummary({ formatPrice }) {
	const {
		cartItems,
		coupon,
	} = useCart();

	// GST rate
	const GST_RATE = 18;

	// Calculate subtotals
	let subtotal = 0; // MRP (GST-incl)
	let subtotalExGST = 0; // GST-excl

	cartItems.forEach(item => {
		const qty = item.quantity || 1;
		if (Array.isArray(item.variant)) {
			// Combo/kit: sum for all included variants
			item.variant.forEach(v => {
				const priceIncl = Number(v.base_price) || Number(v.price) || 0;
				let priceExcl = v.base_price_excluding_gst;
				if (priceExcl === undefined || priceExcl === null) {
					priceExcl = priceIncl ? (priceIncl / 1.18) : 0;
				}
				subtotal += priceIncl * (v.quantity || 1);
				subtotalExGST += priceExcl * (v.quantity || 1);
			});
		} else {
			// Single product
			const v = item.variant || {};
			const priceIncl = Number(v.base_price) || Number(v.price) || 0;
			let priceExcl = v.base_price_excluding_gst;
			if (priceExcl === undefined || priceExcl === null) {
				priceExcl = priceIncl ? (priceIncl / 1.18) : 0;
			}
			subtotal += priceIncl * qty;
			subtotalExGST += priceExcl * qty;
		}
	});

	// Calculate discount on GST-excl subtotal
	let discountExGST = 0;
	let discount = 0;
	if (coupon) {
		if (coupon.percent) {
			discountExGST = subtotalExGST * (Number(coupon.percent) / 100);
		} else if (coupon.discount) {
			discountExGST = Number(coupon.discount) || 0;
		}
		// For display: show equivalent GST-incl discount
		discount = discountExGST * 1.18;
	}

	// Discounted GST-excl subtotal
	const discountedExGST = subtotalExGST - discountExGST;
	// GST on discounted base
	const totalGST = discountedExGST * (GST_RATE / 100);
	// Final total (GST-incl)
	const finalTotal = discountedExGST + totalGST;
	// You saved (MRP - final total)
	const youSaved = subtotal - finalTotal;

	// Debug info
	const debugInfo = {
		subtotal,
		subtotalExGST,
		discount,
		discountExGST,
		discountedExGST,
		totalGST,
		finalTotal,
		youSaved
	};

	if (cartItems.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border p-4">
			<h4 className="text-sm font-medium mb-3">Price Details</h4>

			<div className="space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-gray-600">Subtotal (MRP)</span>
					<span>{formatPrice(subtotal)}</span>
				</div>

				{discount > 0 && (
					<div className="flex justify-between text-green-600">
						<span>Discount {coupon?.code ? `(${coupon.code})` : ""}</span>
						<span>-{formatPrice(discount)}</span>
					</div>
				)}

				<div className="border-t pt-2 mt-2 flex justify-between font-medium">
					<span>Total</span>
					<span>{formatPrice(finalTotal)}</span>
				</div>

				{discount > 0 && (
					<p className="text-green-600 text-xs font-medium">
						You saved {formatPrice(youSaved)} on this order
					</p>
				)}

				{/* Debug info - remove in production */}
				{process.env.NODE_ENV === 'development' && (
					<div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
						<div>Debug Info:</div>
						<div>Subtotal (GST-excl): {formatPrice(subtotalExGST)}</div>
						<div>Discount (GST-excl): {formatPrice(discountExGST)}</div>
						<div>Total (GST-excl): {formatPrice(discountedExGST)}</div>
						<div>GST: {formatPrice(totalGST)}</div>
						<div>Final Total: {formatPrice(finalTotal)}</div>
						<div>You Saved: {formatPrice(youSaved)}</div>
					</div>
				)}
			</div>
		</div>
	);
}
