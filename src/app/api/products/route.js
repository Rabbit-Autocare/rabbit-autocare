// /app/api/products/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	console.error(`API Error (products): ${message}`);
	return NextResponse.json({ error: message }, { status });
}

// GET - Fetch all products or a specific product with related data and filters
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const code = searchParams.get("code");
		const limit = searchParams.get("limit");
		const sort = searchParams.get("sort");
		const include = searchParams.get("include");

		// Filter parameters
		const categoryNameFilter = searchParams.get("category"); // New: filter by category name
		const searchQuery = searchParams.get("search"); // Existing: filter by search term
		const minPriceFilter = searchParams.get("minPrice"); // Existing: filter by min price
		const maxPriceFilter = searchParams.get("maxPrice"); // Existing: filter by max price
		const ratingFilter = searchParams.get("rating"); // Existing: filter by rating
		const inStockFilter = searchParams.get("inStock"); // Existing: filter by stock
		const sizesFilter = searchParams.get("sizes")?.split(",").filter(Boolean); // Existing: filter by sizes (assuming JSONB query)
		const colorsFilter = searchParams.get("colors")?.split(",").filter(Boolean); // Existing: filter by colors (assuming JSONB query)
		const gsmFilter = searchParams.get("gsm")?.split(",").filter(Boolean); // Add GSM filter


		// Define the select statement
		const selectFields = `*`; // Select all fields, including JSONB variants

		if (id) {
			// Get single product
			const { data: product, error: productError } = await supabase
				.from("products")
				.select(selectFields)
				.eq("id", id)
				.single();

			if (productError) {
				if (productError.code === 'PGRST116') {
					return errorResponse("Product not found", 404);
				}
				return errorResponse(productError.message);
			}

			return NextResponse.json({
				success: true,
				product: product // Return raw product, frontend will transform
			});
		}

		// Build query for multiple products with filters
		let query = supabase.from("products").select(selectFields, { count: 'exact' }); // Get count for total

		// Apply filters
		if (categoryNameFilter && categoryNameFilter !== 'all') {
			query = query.eq("category_name", categoryNameFilter);
		}

		if (searchQuery) {
			query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
		}

		// JSONB Filtering for Variants

		// Filter by In Stock (at least one variant with stock > 0)
		if (inStockFilter === 'true') {
			// Use '@>' operator to check if the variants array contains an object with stock > 0
			// Note: This might not be the most performant for very large datasets without proper indexing
			query = query.filter('variants', '@>', '[{ "stock": 1 }]'); // Checks if any element has stock >= 1
		}

		// Filter by Sizes
		if (sizesFilter?.length > 0) {
			// Filter products that have at least one variant whose size is in the sizesFilter array
			// Use '?||' (contains any of) operator with the ->> operator to check text values in the JSONB array
			// Example: WHERE variants::jsonb @> '[{"size": "40x40"}]' OR variants::jsonb @> '[{"size_cm": "40x40"}]';
			// Or using a PostgREST function for more complex checks if needed
			const sizeConditions = sizesFilter.map(size => `(variants::jsonb @> '[{"size": "${size}"}]' OR variants::jsonb @> '[{"size_cm": "${size}"}]')`).join(' OR ');
			query = query.or(sizeConditions);
		}

		// Filter by Colors
		if (colorsFilter?.length > 0) {
			// Filter products that have at least one variant whose color is in the colorsFilter array
			const colorConditions = colorsFilter.map(color => `variants::jsonb @> '[{"color": "${color}"}]'`).join(' OR ');
			query = query.or(colorConditions);
		}

		// Filter by GSM
		if (gsmFilter?.length > 0) {
			// Filter products that have at least one variant whose gsm is in the gsmFilter array
			const gsmConditions = gsmFilter.map(gsm => `variants::jsonb @> '[{"gsm": ${parseInt(gsm)}}]'`).join(' OR '); // Assuming GSM is stored as number
			query = query.or(gsmConditions);
		}

		// Filter by Price Range (requires checking the lowest price across variants)
		if (minPriceFilter !== undefined || maxPriceFilter !== undefined) {
			// This is complex with JSONB. You might need a database function or view that calculates min price per product.
			// A simplified approach for now might filter based on *any* variant price within range, but that's not ideal.
			// A better approach: select min(value->>'price') from jsonb_array_elements(variants) where (value->>'price')::numeric >= minPriceFilter; -- Needs to be done per product.
			// For now, we will rely on frontend filtering for price range if complex backend is not set up.
			console.warn("Price range filtering on JSONB variants is complex and not fully implemented in the API.");
		}

		// Filter by Rating (assuming average_rating might be stored directly or calculated)
		if (ratingFilter) {
			// Assuming average_rating is a column
			query = query.gte('average_rating', Number(ratingFilter));
		}

		// Apply sorting
		if (sort) {
			// Note: Sorting by price on JSONB variants is complex without a dedicated column or view.
			switch (sort) {
				case "newest":
					query = query.order("updated_at", { ascending: false });
					break;
				case "oldest":
					query = query.order("updated_at", { ascending: true });
					break;
				case "name_asc":
					query = query.order("name", { ascending: true });
					break;
				case "name_desc":
					query = query.order("name", { ascending: false });
					break;
				// Price sorting on JSONB needs dedicated logic or view
				// case "price_asc":
				// case "price_desc":
				//   // Placeholder - implement JSONB price sorting
				//   break;
				case "rating":
					// Assuming average_rating column exists
					query = query.order("averageRating", { ascending: false }); // Or the actual rating column name
					break;
				default:
					// Default sort by updated date
					query = query.order("updated_at", { ascending: false });
			}
		} else {
			query = query.order("updated_at", { ascending: false }); // Default sort
		}

		// Apply limit and offset (offset not implemented here)
		if (limit) {
			query = query.limit(Number(limit));
		}

		const { data: products, error, count } = await query;

		if (error) {
			console.error("Supabase query error:", error);
			return errorResponse(error.message);
		}

		// Frontend will handle transformation from raw product data
		return NextResponse.json({
			success: true,
			products: products || [], // Ensure products is an array
			total: count || 0
		});

	} catch (error) {
		console.error("GET /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// POST - Create a new product
export async function POST(request) {
	try {
		const {
			product_code,
			name,
			description,
			category_name,
			subcategory_names,
			is_microfiber,
			main_image_url,
			images,
			variants,
			key_features,
			taglines,
		} = await request.json();

		// Validate required fields
		if (!product_code || !name || !category_name) {
			return errorResponse("Missing required fields: product_code, name, category_name", 400);
		}

		// Check if product code already exists
		const { data: existingProduct } = await supabase
			.from("products")
			.select("id")
			.eq("product_code", product_code)
			.single();

		if (existingProduct) {
			return errorResponse("Product code already exists", 400);
		}

		// Process variants with direct values and proper types
	const processedVariants = variants.map(variant => {
  if (is_microfiber) {
    return {
      gsm: variant.gsm || '',
      size: variant.size || '',
      color: variant.color || '',
      stock: parseInt(variant.stock) || 0,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: variant.compareAtPrice || null,
      variant_type: 'microfiber'
    };
  } else {
    return {
      quantity: variant.quantity || '',
      unit: variant.unit || 'ml',
      stock: parseInt(variant.stock) || 0,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: variant.compareAtPrice || null,
      variant_type: 'liquid'
    };
  }
});


		// Create the product
		const { data: product, error: productError } = await supabase
			.from("products")
			.insert([{
				product_code,
				name,
				description,
				category_name,
				subcategory_names: Array.isArray(subcategory_names) ? subcategory_names : [subcategory_names].filter(Boolean),
				is_microfiber,
				main_image_url,
				images: images || [],
				variants: processedVariants,
				key_features: key_features || [],
				taglines: taglines || []
			}])
			.select("*")
			.single();

		if (productError) return errorResponse(productError.message);

		return NextResponse.json(
			{
				success: true,
				product: product
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("POST /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// PUT - Update a product
export async function PUT(request) {
	try {
		const {
			id,
			product_code,
			name,
			description,
			category_name,
			subcategory_names,
			is_microfiber,
			main_image_url,
			images,
			variants,
			key_features,
			taglines,
		} = await request.json();

		if (!id) {
			return errorResponse("Product ID is required", 400);
		}

		// Process variants with direct values and proper types
	const processedVariants = variants.map(variant => {
  if (is_microfiber) {
    return {
      gsm: variant.gsm || '',
      size: variant.size || '',
      color: variant.color || '',
      stock: parseInt(variant.stock) || 0,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: variant.compareAtPrice || null,
      variant_type: 'microfiber'
    };
  } else {
    return {
      quantity: variant.quantity || '',
      unit: variant.unit || 'ml',
      stock: parseInt(variant.stock) || 0,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: variant.compareAtPrice || null,
      variant_type: 'liquid'
    };
  }
});


		// Update the product
		const { data: product, error: productError } = await supabase
			.from("products")
			.update({
				product_code,
				name,
				description,
				category_name,
				subcategory_names: Array.isArray(subcategory_names) ? subcategory_names : [subcategory_names].filter(Boolean),
				is_microfiber,
				main_image_url,
				images: images || [],
				variants: processedVariants,
				key_features: key_features || [],
				taglines: taglines || []
			})
			.eq("id", id)
			.select("*")
			.single();

		if (productError) return errorResponse(productError.message);

		return NextResponse.json({
			success: true,
			product: product
		});
	} catch (error) {
		console.error("PUT /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// DELETE - Delete a product
export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return errorResponse("Product ID is required", 400);
		}

		const { error } = await supabase
			.from("products")
			.delete()
			.eq("id", id);

		if (error) {
			console.error("Supabase delete error:", error);
			return errorResponse(error.message);
		}

		return NextResponse.json({
			success: true,
			message: "Product deleted successfully"
		});
	} catch (error) {
		console.error("DELETE /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// Helper function to transform product data (can remain on frontend or be shared)
// Moving this to frontend productService.js is a good practice.
function transformProductData(product) {
	// This function is now primarily handled in frontend productService.js
	// The backend should return the raw data from the DB query result.
	return product;
}

// Helper function to get the lowest price from variants (can remain on frontend or be shared)
// Moving this to frontend productService.js is a good practice.
function getLowestPrice(variants) {
	// This function is now primarily handled in frontend productService.js
	return 0; // Placeholder
}
