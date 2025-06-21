"use client";
import { useCart } from "@/hooks/useCart";

export default function PriceSummary({ formatPrice }) {
	const {
		coupon,
		cartItems,
	} = useCart();

	const hasComboOrKit = cartItems.some(item => item.combo_id || item.kit_id);

	const getSubtotal = () => {
		return cartItems.reduce((total, item) => {
			const price = (item.combo_id && item.combo_price)
				? item.combo_price
				: (item.kit_id && item.kit_price)
				? item.kit_price
				: item.variant?.price || 0;
			return total + price * item.quantity;
		}, 0);
	};

	const subtotal = getSubtotal();

	// Coupon logic: only apply if no combo/kit and subtotal >= coupon.applicable_upto
	function applyCouponAndCalculateDiscount() {
		console.log('PriceSummary - applyCouponAndCalculateDiscount called with:', { coupon, hasComboOrKit, subtotal });

		if (!coupon || hasComboOrKit) {
			return { discount: 0, message: hasComboOrKit ? 'Coupons are not applicable when combos or kits are in the cart.' : '' };
		}

		// Use the pre-calculated discount from the coupon object
		const discount = coupon.discount || 0;
		console.log('PriceSummary - calculated discount:', discount);

		return { discount, message: '' };
	}

	const { discount, message: couponMessage } = applyCouponAndCalculateDiscount();
	const total = Math.max(0, subtotal - discount);

	if (cartItems.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border p-4">
			<h4 className="text-sm font-medium mb-3">Price Details</h4>

			<div className="space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-gray-600">Subtotal</span>
					<span>{formatPrice(subtotal)}</span>
				</div>

				{hasComboOrKit && (
					<p className="text-red-500 text-xs mb-2">Coupons are not applicable when combos or kits are in the cart.</p>
				)}

				{couponMessage && (
					<p className={`text-xs mb-2 ${hasComboOrKit ? 'text-red-500' : 'text-orange-500'}`}>{couponMessage}</p>
				)}

				{discount > 0 && (
					<div className="flex justify-between text-green-600">
						<span>Discount {coupon?.code ? `(${coupon.code})` : ""}</span>
						<span>-{formatPrice(discount)}</span>
					</div>
				)}

				<div className="border-t pt-2 mt-2 flex justify-between font-medium">
					<span>Total</span>
					<span>{formatPrice(total)}</span>
				</div>

				{discount > 0 && (
					<p className="text-green-600 text-xs font-medium">
						You saved {formatPrice(discount)} on this order
					</p>
				)}
			</div>
		</div>
	);
}
