import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
	try {
		const supabase = createServerComponentClient({ cookies });

		// Check authentication
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Unauthorized - Please log in" },
				{ status: 401 },
			);
		}

		// Fetch all active coupons
		const { data: allCoupons, error: couponsError } = await supabase
			.from("coupons")
			.select("*")
			.eq("is_active", true);

		if (couponsError) {
			return NextResponse.json(
				{ error: "Failed to fetch coupons" },
				{ status: 500 },
			);
		}

		// Get coupons already used by this user
		const { data: usedCoupons, error: usedCouponsError } = await supabase
			.from("user_coupons")
			.select("coupon_id")
			.eq("user_id", user.id);

		if (usedCouponsError) {
			return NextResponse.json(
				{ error: "Failed to fetch used coupons" },
				{ status: 500 },
			);
		}

		const usedCouponIds = new Set(usedCoupons?.map((uc) => uc.coupon_id) || []);

		// Filter out expired and already used coupons
		const now = new Date();
		const availableCoupons = allCoupons.filter((coupon) => {
			// Skip if already used by this user
			if (usedCouponIds.has(coupon.id)) return false;

			// Skip if expired
			if (!coupon.is_permanent && new Date(coupon.expiry_date) < now) return false;

			return true;
		});

		return NextResponse.json({ coupons: availableCoupons });
	} catch (error) {
		console.error("Error in user coupons API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
