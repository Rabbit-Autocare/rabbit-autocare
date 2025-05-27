import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET all combos for combo page
export async function GET(request) {
	try {
		const supabase = createServerComponentClient({ cookies });
		const { searchParams } = new URL(request.url);

		// Optional query parameters
		const limit = searchParams.get("limit")
			? Number.parseInt(searchParams.get("limit"))
			: null;
		const offset = searchParams.get("offset")
			? Number.parseInt(searchParams.get("offset"))
			: 0;

		console.log("Fetching all combos with limit:", limit, "offset:", offset);

		// Build query
		let query = supabase
			.from("combos")
			.select("*")
			.order("created_at", { ascending: false });

		// Add pagination if specified
		if (limit) {
			query = query.range(offset, offset + limit - 1);
		}

		const { data: combos, error } = await query;

		if (error) {
			console.error("Supabase error fetching all combos:", error);
			return NextResponse.json(
				{ error: "Failed to fetch combos" },
				{ status: 500 },
			);
		}

		console.log(`Fetched ${combos?.length || 0} combos`);

		// Transform the data to ensure consistent format
		const transformedCombos = (combos || []).map((combo) => ({
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
			// Calculate savings
			savings:
				combo.original_price && combo.price
					? Number.parseFloat(combo.original_price) -
						Number.parseFloat(combo.price)
					: 0,
			// Calculate savings percentage
			savings_percent:
				combo.original_price &&
				combo.price &&
				combo.original_price > combo.price
					? Math.round(
							((Number.parseFloat(combo.original_price) -
								Number.parseFloat(combo.price)) /
								Number.parseFloat(combo.original_price)) *
								100,
						)
					: 0,
		}));

		return NextResponse.json({
			combos: transformedCombos,
			total: combos?.length || 0,
			offset,
			limit,
		});
	} catch (error) {
		console.error("Error fetching all combos:", error);
		return NextResponse.json(
			{ error: "Failed to fetch combos" },
			{ status: 500 },
		);
	}
}
