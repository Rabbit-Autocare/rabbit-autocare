"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { Check, Ticket, X, Loader2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CouponCard from "@/components/ui/CouponCard";
import { UserService } from "@/lib/service/userService";

export default function CouponSection() {
	const { coupon, applyCoupon, couponLoading, couponError } = useCart();
	const { user } = useAuth();

	const [couponCode, setCouponCode] = useState("");
	const [availableCoupons, setAvailableCoupons] = useState([]);
	const [couponsLoading, setCouponsLoading] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	// Fetch user coupons using UserService
	const fetchUserCoupons = async () => {
		if (!user) {
			setAvailableCoupons([]);
			return;
		}

		try {
			setCouponsLoading(true);
			const result = await UserService.getUserCoupons(user.id);
			if (result.success) {
				setAvailableCoupons(result.data);
			} else {
				setAvailableCoupons([]);
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
	}, [user]); // Refetch when user changes

	// Refetch available coupons whenever the coupon state changes
	useEffect(() => {
		fetchUserCoupons();
	}, [coupon]); // This will refetch when a coupon is applied or removed

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

	const handleCouponCardClick = async (coupon) => {
		try {
			await navigator.clipboard.writeText(coupon.code);
			setCouponCode(coupon.code);
			applyCoupon(coupon.code);
		} catch (err) {
			// fallback or error handling
		}
	};

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev === 0 ? availableCoupons.length - 1 : prev - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev === availableCoupons.length - 1 ? 0 : prev + 1));
	};

	if (!user) {
		return (
			<div className="bg-gray-50 rounded-lg p-4">
				<h4 className="text-sm font-medium flex items-center gap-2 mb-3">
					<Ticket size={16} className="text-blue-600" />
					Apply Coupon
				</h4>
				<p className="text-sm text-gray-600">Please login to use coupons</p>
			</div>
		);
	}

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
					<div className="flex items-center justify-center ">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
					</div>
				) : availableCoupons.length > 0 ? (
					<div className="flex items-center justify-center gap-4">
						<button
							onClick={handlePrev}
							className="p-2 h-full  "
							aria-label="Previous coupon"
							disabled={availableCoupons.length <= 1}
						>
							<ChevronLeft size={24} />
						</button>
						<div className="relative  w-[300px] flex-shrink-0" onClick={() => handleCouponCardClick(availableCoupons[currentIndex])}>
							<CouponCard
								code={availableCoupons[currentIndex].code}
								discount={availableCoupons[currentIndex].discount}
								validUpto={availableCoupons[currentIndex].expiry}
							/>
							{coupon?.code === availableCoupons[currentIndex].code && (
								<div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">Applied</div>
							)}
						</div>
						<button
							onClick={handleNext}
							className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300"
							aria-label="Next coupon"
							disabled={availableCoupons.length <= 1}
						>
							<ChevronRight size={24} />
						</button>
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
