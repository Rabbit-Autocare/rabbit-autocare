"use client";
import { useCart } from "@/hooks/useCart";

export default function PriceSummary({ formatPrice }) {
	const { cartItems, coupon } = useCart();
	const GST_RATE = 18;

	let subtotal = 0; // MRP (incl GST)
	let gstRemoved = 0;
	let basePrice = 0; // Price without GST (for discount)

	cartItems.forEach(item => {
		const qty = item.quantity || 1;

		const getPrice = (incl, excl) => {
			const priceIncl = Number(incl) || 0;
			const priceExcl = excl ?? priceIncl / 1.18;
			return [priceIncl * qty, priceExcl * qty];
		};

		if (item.kit_id && item.kit_price) {
			const [incl, excl] = getPrice(item.kit_price, item.kit_price_excluding_gst);
			subtotal += incl;
			basePrice += excl;
		} else if (item.combo_id && item.combo_price) {
			const [incl, excl] = getPrice(item.combo_price, item.combo_price_excluding_gst);
			subtotal += incl;
			basePrice += excl;
		} else if (Array.isArray(item.variant)) {
			item.variant.forEach(v => {
				const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
				subtotal += incl;
				basePrice += excl;
			});
		} else {
			const v = item.variant || {};
			const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
			subtotal += incl;
			basePrice += excl;
		}
	});

	// Step 1: Calculate GST removed
	gstRemoved = subtotal - basePrice;

	// Step 2: Apply discount only on base price (ex-GST)
	let discount = 0;
	if (coupon?.percent) {
		discount = Math.round(basePrice * (coupon.percent / 100));
	} else if (coupon?.discount) {
  // Flat ₹42 discount (GST-incl), convert to GST-excl before subtracting from base
  const discountIncl = Number(coupon.discount);
  discount = Math.round(discountIncl / 1.18); // GST removed
}


	const discountedBase = basePrice - discount;

	// Step 3: Add back original GST (not recalculated)
	const finalTotal = discountedBase + gstRemoved;
	const youSaved = subtotal - finalTotal;

	if (!cartItems?.length) return null;

	return (
		<div className="bg-white rounded-lg border p-4">
			<h4 className="text-sm font-medium mb-3">Price Details</h4>

			<div className="space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-gray-600">Subtotal (MRP)</span>
					<span>{formatPrice(subtotal)}</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">GST Removed</span>
					<span>{formatPrice(gstRemoved)}</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">Base Price</span>
					<span>{formatPrice(basePrice)}</span>
				</div>

				{discount > 0 && (
					<div className="flex justify-between text-green-600">
						<span>Discount {coupon?.code ? `(${coupon.code})` : ""}</span>
						<span>-{formatPrice(discount)}</span>
					</div>
				)}

				<div className="flex justify-between">
					<span className="text-gray-600">Discounted Base Price</span>
					<span>{formatPrice(discountedBase)}</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">Add GST Back</span>
					<span>+{formatPrice(gstRemoved)}</span>
				</div>

				<div className="border-t pt-2 mt-2 flex justify-between font-medium">
					<span>Total</span>
					<span>{formatPrice(finalTotal)}</span>
				</div>

				{youSaved > 0 && (
					<p className="text-green-600 text-xs font-medium">
						You saved {formatPrice(youSaved)} on this order
					</p>
				)}
			</div>
		</div>
	);
}
