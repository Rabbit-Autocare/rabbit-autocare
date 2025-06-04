import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	console.error(`API Error (kits): ${message}`);
	return NextResponse.json({ error: message }, { status });
}

// GET - Fetch all combos and format them as products
export async function GET(request) {
	try {
		const supabase = createServerComponentClient({ cookies });
		const { searchParams } = new URL(request.url);

		// Optional query parameters (forwarding relevant ones to combo fetch)
		const limit = searchParams.get("limit")
			? Number.parseInt(searchParams.get("limit"))
			: null;
		// Add other filter parameters if your combo table supports them
		// const sort = searchParams.get("sort");
		// const minPrice = searchParams.get("minPrice");
		// etc.

		console.log("Fetching kits & combos...");

		// Fetch all combos (or apply relevant filters if supported by combo table)
		let query = supabase
			.from("combos")
			.select("*") // Select all fields from combos table
			.order("created_at", { ascending: false }); // Default sort for combos

		// Apply pagination if specified
		if (limit) {
			query = query.limit(Number(limit));
		}

		// Note: Implementing full filtering (price range, sizes, colors, stock) for combos
		// based on their constituent products would require complex backend logic or database functions.
		// This implementation only forwards limit/offset and basic sorting if applicable to the combo table.

		const { data: combos, error } = await query;

		if (error) {
			console.error("Supabase error fetching combos for kits route:", error);
			return errorResponse("Failed to fetch kits & combos");
		}

		console.log(`Fetched ${combos?.length || 0} combos for kits route`);

		// Transform combos data into a product-like structure
		const transformedCombos = (combos || []).map((combo) => ({
			// Map combo fields to expected product fields
			id: `combo-${combo.id}`, // Prefix to distinguish from regular products if needed
			product_code: `COMBO-${combo.id}`, // Generate a code if needed
			name: combo.name || "Unnamed Combo",
			description: combo.description || "",
			// Assuming your combo table has a price field
			variants: [
				{
					id: `combo-variant-${combo.id}`, // Unique variant ID for the combo
					price: Number.parseFloat(combo.price || combo.discounted_price || combo.original_price || 0), // Use the appropriate price field
					// Assuming combos are always in stock if they exist (adjust if your combo table has stock)
					stock: 1000, // Placeholder stock
					// Combo variants might not have size/color in the same way as individual products
					value: "Combo Pack"
				}
			],
			// Assuming your combo table has an image_url field
			main_image_url: combo.image_url || "/placeholder.svg",
			images: combo.image_url ? [combo.image_url] : [], // Use image_url for images array
			// Assume 'Kits & Combos' is the category name
			category_name: "Kits & Combos",
			subcategory_names: [], // Combos might not have subcategories
			is_microfiber: false, // Or determine based on combo content
			key_features: [], // Add logic to get features if available
			taglines: [], // Add logic to get taglines if available
			reviews: [], // Add logic to get reviews if available
			averageRating: 0, // Add logic to calculate average rating
			created_at: combo.created_at,
			updated_at: combo.updated_at,
			// Include original combo data if useful (optional)
			// _originalCombo: combo

		}));

		return NextResponse.json({
			success: true,
			products: transformedCombos, // Return as 'products' to match other API responses
			total: transformedCombos.length // Total count of transformed items
		});

	} catch (error) {
		console.error("GET /api/products/kits error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}
