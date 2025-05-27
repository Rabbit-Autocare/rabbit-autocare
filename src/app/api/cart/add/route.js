import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
	try {
		// Initialize Supabase client with cookies
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

		// Parse request body
		const requestData = await request.json();
		const {
			productId,
			quantity = 1,
			isCombo = false,
			variantData,
		} = requestData;

		// Validate required fields
		if (!productId) {
			return NextResponse.json(
				{ error: "Product ID is required" },
				{ status: 400 },
			);
		}

		// Additional validation for regular products
		if (!isCombo && (!variantData || !variantData.size || !variantData.price)) {
			return NextResponse.json(
				{ error: "Variant data is required for products" },
				{ status: 400 },
			);
		}

		// Check for existing cart item
		const { data: existingItem } = await supabase
			.from("cart_items")
			.select("*")
			.eq("user_id", user.id)
			.eq("product_id", productId)
			.eq("is_combo", isCombo)
			.eq(!isCombo ? "variant_size" : "", !isCombo ? variantData.size : "")
			.maybeSingle();

		if (existingItem) {
			// Update existing item
			const { error: updateError } = await supabase
				.from("cart_items")
				.update({
					quantity: existingItem.quantity + quantity,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingItem.id);

			if (updateError) throw updateError;

			return NextResponse.json({
				success: true,
				action: "updated",
				newQuantity: existingItem.quantity + quantity,
			});
		} else {
			// Insert new item
			const newItem = {
				user_id: user.id,
				product_id: productId,
				quantity,
				is_combo: isCombo,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				...(!isCombo && {
					name: variantData.name,
					price: variantData.price,
					image: variantData.image,
					variant_size: variantData.size,
				}),
			};

			const { error: insertError } = await supabase
				.from("cart_items")
				.insert(newItem);

			if (insertError) throw insertError;

			return NextResponse.json({
				success: true,
				action: "added",
			});
		}
	} catch (error) {
		console.error("Cart API Error:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 },
		);
	}
}
