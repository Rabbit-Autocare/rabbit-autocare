"use client";
import { useCart } from "@/hooks/useCart";

export default function PriceSummary() {
	const {
		calculateSubtotal,
		calculateDiscount,
		calculateTotal,
		coupon,
		cartItems,
	} = useCart();

	// Fallback calculations if hook methods don't exist
	const getSubtotal = () => {
		if (calculateSubtotal) return calculateSubtotal();
		return cartItems.reduce((total, item) => {
			const price = item.product?.price || item.price || 0;
			return total + price * item.quantity;
		}, 0);
	};

	const getDiscount = () => {
		if (calculateDiscount) return calculateDiscount();
		if (!coupon) return 0;
		const subtotal = getSubtotal();
		if (coupon.type === "percentage") {
			return (subtotal * coupon.value) / 100;
		}
		return coupon.value || 0;
	};

	const getTotal = () => {
		if (calculateTotal) return calculateTotal();
		return Math.max(0, getSubtotal() - getDiscount());
	};

	const subtotal = getSubtotal();
	const discount = getDiscount();
	const total = getTotal();

	if (cartItems.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border p-4">
			<h4 className="text-sm font-medium mb-3">Price Details</h4>

			<div className="space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-gray-600">Subtotal</span>
					<span>₹{subtotal.toFixed(2)}</span>
				</div>

				{discount > 0 && (
					<div className="flex justify-between text-green-600">
						<span>Discount {coupon?.code ? `(${coupon.code})` : ""}</span>
						<span>-₹{discount.toFixed(2)}</span>
					</div>
				)}

				<div className="border-t pt-2 mt-2 flex justify-between font-medium">
					<span>Total</span>
					<span>₹{total.toFixed(2)}</span>
				</div>

				{discount > 0 && (
					<p className="text-green-600 text-xs font-medium">
						You saved ₹{discount.toFixed(2)} on this order
					</p>
				)}
			</div>
		</div>
	);
}
