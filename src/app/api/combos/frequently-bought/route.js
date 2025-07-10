import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request) {
	try {
		const supabase = await createSupabaseServerClient();
		const { cartItems = [] } = await request.json();

		console.log("API: Received cart items:", cartItems);

		if (!cartItems || cartItems.length === 0) {
			return NextResponse.json({ combos: [] });
		}

		// Extract product IDs from cart items
		const cartProductIds = cartItems
			.map((item) => {
				return (
					item.product_id ||
					item.productId ||
					item.id ||
					(item.product && item.product.id)
				);
			})
			.filter(Boolean);

		console.log("API: Extracted cart product IDs:", cartProductIds);

		if (cartProductIds.length === 0) {
			return NextResponse.json({ combos: [] });
		}

		// Fetch all combos from your table
		const { data: allCombos, error: combosError } = await supabase
			.from("combos")
			.select("*")
			.order("created_at", { ascending: false });

		if (combosError) {
			console.error("API: Supabase error fetching combos:", combosError);
			return NextResponse.json(
				{ error: "Failed to fetch combos" },
				{ status: 500 },
			);
		}

		console.log(`API: Fetched ${allCombos?.length || 0} total combos`);

		if (!allCombos || allCombos.length === 0) {
			return NextResponse.json({ combos: [] });
		}

		// Filter combos that contain any of the cart product IDs
		const relevantCombos = allCombos.filter((combo) => {
			if (!combo.products || !Array.isArray(combo.products)) {
				console.log(
					`API: Combo ${combo.id} has invalid products:`,
					combo.products,
				);
				return false;
			}

			// Check if any product in the combo matches any product in the cart
			const hasMatchingProduct = combo.products.some((comboProduct) => {
				const comboProductId = comboProduct.product_id;
				const isMatch = cartProductIds.includes(comboProductId);
				if (isMatch) {
					console.log(
						`API: Found matching product: ${comboProductId} in combo: ${combo.name}`,
					);
				}
				return isMatch;
			});

			return hasMatchingProduct;
		});

		console.log(`API: Found ${relevantCombos.length} relevant combos`);

		// Limit to 6 results
		const limitedCombos = relevantCombos.slice(0, 6);

		// Transform the data to ensure consistent format
		const transformedCombos = limitedCombos.map((combo) => ({
			id: combo.id,
			name: combo.name,
			description: combo.description,
			original_price: Number.parseFloat(combo.original_price || 0),
			discounted_price: Number.parseFloat(combo.price || 0),
			price: Number.parseFloat(combo.price || 0),
			image_url: combo.image_url,
			products: combo.products || [],
			discount_percent: combo.discount_percent
				? Number.parseFloat(combo.discount_percent)
				: null,
			created_at: combo.created_at,
		}));

		console.log("API: Returning transformed combos:", transformedCombos);

		return NextResponse.json({ combos: transformedCombos });
	} catch (error) {
		console.error("API: Error in frequently-bought API:", error);
		return NextResponse.json(
			{ error: "Failed to fetch combo products" },
			{ status: 500 },
		);
	}
}
