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

		// Fetch user coupons from auth_users table or a dedicated coupons table
		// Option 1: If coupons are stored in auth.users metadata or a custom field
		const { data: userData, error: userError } = await supabase
			.from("auth_users") // or your custom users table
			.select("coupons")
			.eq("id", user.id)
			.single();

		if (userError && userError.code !== "PGRST116") {
			// PGRST116 is "not found" error
			console.error("Error fetching user data:", userError);
			return NextResponse.json(
				{ error: "Failed to fetch user coupons" },
				{ status: 500 },
			);
		}

		// Option 2: If you have a separate user_coupons table
		// const { data: userCoupons, error: couponsError } = await supabase
		//   .from('user_coupons')
		//   .select(`
		//     *,
		//     coupon:coupons(*)
		//   `)
		//   .eq('user_id', user.id)
		//   .eq('is_used', false)
		//   .eq('is_active', true)

		// For now, let's return some sample coupons or empty array
		const coupons = userData?.coupons || [
			{
				code: "WELCOME10",
				description: "10% off on your first order",
				type: "percentage",
				value: 10,
				min_order_amount: 500,
				expires_at: "2024-12-31",
			},
			{
				code: "SAVE50",
				description: "₹50 off on orders above ₹1000",
				type: "fixed",
				value: 50,
				min_order_amount: 1000,
				expires_at: "2024-12-31",
			},
		];

		return NextResponse.json({ coupons });
	} catch (error) {
		console.error("Error in user coupons API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
