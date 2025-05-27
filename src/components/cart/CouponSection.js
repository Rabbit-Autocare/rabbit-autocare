"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { Check, Ticket, X, Loader2, Tag } from "lucide-react";

export default function CouponSection() {
	const { coupon, applyCoupon, couponLoading, couponError } = useCart();

	const [couponCode, setCouponCode] = useState("");
	const [availableCoupons, setAvailableCoupons] = useState([]);
	const [couponsLoading, setCouponsLoading] = useState(false);

	// Fetch user coupons
	const fetchUserCoupons = async () => {
		try {
			setCouponsLoading(true);
			const response = await fetch("/api/user/coupons");
			if (response.ok) {
				const data = await response.json();
				setAvailableCoupons(data.coupons || []);
			}
		} catch (error) {
			console.error("Error fetching user coupons:", error);
			setAvailableCoupons([]);
		} finally {
			setCouponsLoading(false);
		}
	};

	useEffect(() => {
		fetchUserCoupons();
	}, []);

	const handleApplyCoupon = (e) => {
		e.preventDefault();
		if (couponCode.trim()) {
			applyCoupon(couponCode.trim());
		}
	};

	const handleRemoveCoupon = () => {
		applyCoupon(null);
		setCouponCode("");
	};

	const handleApplyAvailableCoupon = (couponCodeToApply) => {
		setCouponCode(couponCodeToApply);
		applyCoupon(couponCodeToApply);
	};

	return (
		<div className="bg-gray-50 rounded-lg p-4">
			<h4 className="text-sm font-medium flex items-center gap-2 mb-3">
				<Ticket size={16} className="text-blue-600" />
				Apply Coupon
			</h4>

			{coupon ? (
				<div className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-3 mb-4">
					<div className="flex items-center gap-2">
						<div className="bg-green-100 rounded-full p-1">
							<Check size={14} className="text-green-600" />
						</div>
						<div>
							<span className="text-sm font-medium">{coupon.code}</span>
							<p className="text-xs text-gray-600">{coupon.description}</p>
						</div>
					</div>
					<button
						onClick={handleRemoveCoupon}
						className="text-gray-500 hover:text-gray-700"
					>
						<X size={16} />
					</button>
				</div>
			) : (
				<form onSubmit={handleApplyCoupon} className="flex gap-2 mb-4">
					<input
						type="text"
						value={couponCode}
						onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
						placeholder="Enter coupon code"
						className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={couponLoading || !couponCode.trim()}
						className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm min-w-16 transition-colors"
					>
						{couponLoading ? (
							<Loader2 size={16} className="animate-spin mx-auto" />
						) : (
							"Apply"
						)}
					</button>
				</form>
			)}

			{couponError && (
				<p className="text-red-500 text-xs mb-4">{couponError}</p>
			)}

			{/* Available Coupons */}
			<div>
				<p className="text-sm font-medium mb-2">Available Coupons</p>
				{couponsLoading ? (
					<div className="flex items-center justify-center py-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
					</div>
				) : availableCoupons.length > 0 ? (
					<div className="space-y-2 max-h-32 overflow-y-auto">
						{availableCoupons.map((availableCoupon) => (
							<div
								key={availableCoupon.code}
								className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2"
							>
								<div className="flex-1">
									<span className="text-sm font-medium text-blue-800">
										{availableCoupon.code}
									</span>
									<p className="text-xs text-blue-600">
										{availableCoupon.description}
									</p>
								</div>
								<button
									onClick={() =>
										handleApplyAvailableCoupon(availableCoupon.code)
									}
									disabled={coupon?.code === availableCoupon.code}
									className="text-blue-600 text-xs hover:text-blue-800 border border-blue-300 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{coupon?.code === availableCoupon.code ? "Applied" : "Apply"}
								</button>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-gray-300">
						<div className="bg-gray-100 p-2 rounded-full mb-2">
							<Tag size={20} className="text-gray-500" />
						</div>
						<p className="text-gray-600 text-sm">No coupons available</p>
						<p className="text-gray-500 text-xs mt-1">
							Check back later for new offers
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
