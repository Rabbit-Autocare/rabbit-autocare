import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// GET specific combo by ID
export async function GET(request, { params }) {
	try {
		const supabase = await createSupabaseServerClient();
		const { id } = params;

		console.log("Fetching combo with ID:", id);

		const { data: combo, error } = await supabase
			.from("combos")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			console.error("Supabase error fetching combo:", error);
			if (error.code === "PGRST116") {
				return NextResponse.json({ error: "Combo not found" }, { status: 404 });
			}
			return NextResponse.json(
				{ error: "Failed to fetch combo" },
				{ status: 500 },
			);
		}

		// Transform the data
		const transformedCombo = {
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
			savings:
				combo.original_price && combo.price
					? Number.parseFloat(combo.original_price) -
						Number.parseFloat(combo.price)
					: 0,
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
		};

		return NextResponse.json({ combo: transformedCombo });
	} catch (error) {
		console.error("Error fetching combo:", error);
		return NextResponse.json(
			{ error: "Failed to fetch combo" },
			{ status: 500 },
		);
	}
}
