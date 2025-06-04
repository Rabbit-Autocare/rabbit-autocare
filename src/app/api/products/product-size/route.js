// /app/api/products/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	console.error(`API Error (products): ${message}`);
	return NextResponse.json({ error: message }, { status });
}

// GET - Fetch all products or a specific product with filters
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const code = searchParams.get("code");
		const limit = searchParams.get("limit");
		const sort = searchParams.get("sort");

		// Filter parameters
		const categoryNameFilter = searchParams.get("category");
		const searchQuery = searchParams.get("search");
		const minPriceFilter = searchParams.get("minPrice");
		const maxPriceFilter = searchParams.get("maxPrice");
		const ratingFilter = searchParams.get("rating");
		const inStockFilter = searchParams.get("inStock");
		const sizesFilter = searchParams.get("sizes")?.split(",").filter(Boolean);
		const colorsFilter = searchParams.get("colors")?.split(",").filter(Boolean);

		if (id) {
			// Get single product
			const { data: product, error: productError } = await supabase
				.from("products")
				.select("*")
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
				product: product
			});
		}

		if (code) {
			// Get single product by code
			const { data: product, error: productError } = await supabase
				.from("products")
				.select("*")
				.eq("product_code", code)
				.single();

			if (productError) {
				if (productError.code === 'PGRST116') {
					return errorResponse("Product not found", 404);
				}
				return errorResponse(productError.message);
			}

			return NextResponse.json({
				success: true,
				product: product
			});
		}

		// Build query for multiple products with filters
		let query = supabase.from("products").select("*", { count: 'exact' });

		// Apply filters
		if (categoryNameFilter && categoryNameFilter !== 'all') {
			query = query.eq("category_name", categoryNameFilter);
		}

		if (searchQuery) {
			query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
		}

		// Advanced JSONB filtering for variants
		if (inStockFilter === 'true') {
			// Filter products that have at least one variant with stock > 0
			query = query.gt('variants->0->stock', 0);
		}

		if (minPriceFilter) {
			// This is complex with JSONB - you might need a database function
			// For now, we'll handle this on the frontend or create a view
			console.log("MinPrice filter needs JSONB handling");
		}

		if (maxPriceFilter) {
			console.log("MaxPrice filter needs JSONB handling");
		}

		if (sizesFilter?.length > 0) {
			// Complex JSONB query needed
			console.log("Size filter needs JSONB handling");
		}

		if (colorsFilter?.length > 0) {
			// Complex JSONB query needed
			console.log("Color filter needs JSONB handling");
		}

		// Apply sorting
		if (sort) {
			switch (sort) {
				case "newest":
					query = query.order("created_at", { ascending: false });
					break;
				case "oldest":
					query = query.order("created_at", { ascending: true });
					break;
				case "name_asc":
					query = query.order("name", { ascending: true });
					break;
				case "name_desc":
					query = query.order("name", { ascending: false });
					break;
				case "price_asc":
				case "price_desc":
					// Price sorting requires complex JSONB queries
					console.log("Price sorting needs JSONB handling");
					query = query.order("created_at", { ascending: false });
					break;
				default:
					query = query.order("created_at", { ascending: false });
			}
		} else {
			query = query.order("created_at", { ascending: false });
		}

		// Apply limit
		if (limit) {
			query = query.limit(Number(limit));
		}

		const { data: products, error, count } = await query;

		if (error) return errorResponse(error.message);

		return NextResponse.json({
			success: true,
			products: products || [],
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
			is_microfiber = false,
			main_image_url,
			images = [],
			variants = [],
			key_features = [],
			taglines = [],
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

		// Validate category exists (optional - depends on your requirements)
		if (category_name) {
			const { data: categoryExists } = await supabase
				.from("categories")
				.select("id")
				.eq("name", category_name)
				.single();

			if (!categoryExists) {
				console.warn(`Category '${category_name}' not found in categories table`);
				// You can either:
				// 1. Continue anyway (store the name even if category doesn't exist)
				// 2. Return an error
				// 3. Auto-create the category
				// For now, we'll continue with a warning
			}
		}

		// Process variants with proper validation
		const processedVariants = variants.map(variant => ({
			...variant,
			stock: parseInt(variant.stock) || 0,
			price: parseFloat(variant.price) || 0,
			variant_type: is_microfiber ? 'microfiber' : 'liquid'
		}));

		// Ensure subcategory_names is an array
		const processedSubcategories = Array.isArray(subcategory_names)
			? subcategory_names
			: (subcategory_names ? [subcategory_names] : []);

		// Create the product
		const { data: product, error: productError } = await supabase
			.from("products")
			.insert([{
				product_code,
				name,
				description,
				category_name,
				subcategory_names: processedSubcategories,
				is_microfiber,
				main_image_url,
				images,
				variants: processedVariants,
				key_features,
				taglines,
				created_at: new Date().toISOString()
			}])
			.select("*")
			.single();

		if (productError) return errorResponse(productError.message);

		return NextResponse.json(
			{
				success: true,
				product: product,
				message: "Product created successfully"
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("POST /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// PUT - Update an existing product
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

		// Validate required fields
		if (!id) {
			return errorResponse("Product ID is required", 400);
		}

		// Check if product exists
		const { data: existingProduct, error: checkError } = await supabase
			.from("products")
			.select("id, product_code")
			.eq("id", id)
			.single();

		if (checkError) {
			if (checkError.code === 'PGRST116') {
				return errorResponse("Product not found", 404);
			}
			return errorResponse(checkError.message);
		}

		// If product_code is being changed, check if new code already exists
		if (product_code && product_code !== existingProduct.product_code) {
			const { data: codeExists } = await supabase
				.from("products")
				.select("id")
				.eq("product_code", product_code)
				.neq("id", id)
				.single();

			if (codeExists) {
				return errorResponse("Product code already exists", 400);
			}
		}

		// Validate category exists if provided
		if (category_name) {
			const { data: categoryExists } = await supabase
				.from("categories")
				.select("id")
				.eq("name", category_name)
				.single();

			if (!categoryExists) {
				console.warn(`Category '${category_name}' not found in categories table`);
			}
		}

		// Build update object with only provided fields
		const updateData = {};

		if (product_code !== undefined) updateData.product_code = product_code;
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (category_name !== undefined) updateData.category_name = category_name;
		if (is_microfiber !== undefined) updateData.is_microfiber = is_microfiber;
		if (main_image_url !== undefined) updateData.main_image_url = main_image_url;
		if (images !== undefined) updateData.images = images;
		if (key_features !== undefined) updateData.key_features = key_features;
		if (taglines !== undefined) updateData.taglines = taglines;

		// Process subcategories
		if (subcategory_names !== undefined) {
			updateData.subcategory_names = Array.isArray(subcategory_names)
				? subcategory_names
				: (subcategory_names ? [subcategory_names] : []);
		}

		// Process variants if provided
		if (variants !== undefined) {
			updateData.variants = variants.map(variant => ({
				...variant,
				stock: parseInt(variant.stock) || 0,
				price: parseFloat(variant.price) || 0,
				variant_type: is_microfiber ? 'microfiber' : 'liquid'
			}));
		}

		// Add updated timestamp
		updateData.updated_at = new Date().toISOString();

		// Update the product
		const { data: product, error: updateError } = await supabase
			.from("products")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (updateError) return errorResponse(updateError.message);

		return NextResponse.json({
			success: true,
			product: product,
			message: "Product updated successfully"
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

		// Check if product exists
		const { data: existingProduct, error: checkError } = await supabase
			.from("products")
			.select("id, name")
			.eq("id", id)
			.single();

		if (checkError) {
			if (checkError.code === 'PGRST116') {
				return errorResponse("Product not found", 404);
			}
			return errorResponse(checkError.message);
		}

		// Delete the product
		const { error: deleteError } = await supabase
			.from("products")
			.delete()
			.eq("id", id);

		if (deleteError) return errorResponse(deleteError.message);

		return NextResponse.json({
			success: true,
			message: `Product "${existingProduct.name}" deleted successfully`
		});
	} catch (error) {
		console.error("DELETE /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}
