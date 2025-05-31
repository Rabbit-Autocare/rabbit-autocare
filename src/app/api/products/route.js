// /app/api/products/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	return NextResponse.json({ error: message }, { status });
}

// GET - Fetch all products or a specific product with related data
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (id) {
			// Get single product with all related data
			const { data: product, error: productError } = await supabase
				.from("products")
				.select(`
					*,
					main_category:categories!products_main_category_id_fkey(*),
					product_subcategories(
						category:categories!product_subcategories_category_id_fkey(id)
					)
				`)
				.eq("id", id)
				.single();

			if (productError) return errorResponse(productError.message);
			return NextResponse.json({ success: true, product });
		}

		// Get all products with basic info
		const { data: products, error } = await supabase
			.from("products")
			.select(`
				*,
				main_category:categories!products_main_category_id_fkey(*),
				product_subcategories(
					category:categories!product_subcategories_category_id_fkey(id)
				)
			`);

		if (error) return errorResponse(error.message);
		return NextResponse.json({ success: true, products });
	} catch (error) {
		return errorResponse(error.message);
	}
}

// POST - Create a new product
export async function POST(request) {
	try {
		const {
			product_code,
			name,
			description,
			main_category_id,
			is_microfiber,
			main_image_url,
			images,
			variants,
			key_features,
			taglines,
			subcategories
		} = await request.json();

		// Start a transaction
		const { data: product, error: productError } = await supabase
			.from("products")
			.insert([{
				product_code,
				name,
				description,
				main_category_id,
				is_microfiber,
				main_image_url,
				images: images || [],
				variants: variants?.map(variant => ({
					...variant,
					stock: parseInt(variant.stock) || 0,
					price: parseFloat(variant.price) || 0
				})) || [],
				key_features: key_features || [],
				taglines: taglines || []
			}])
			.select()
			.single();

		if (productError) return errorResponse(productError.message);

		// Insert subcategories
		if (subcategories?.length > 0) {
			const subcategoryRecords = subcategories.map(category_id => ({
				product_id: product.id,
				category_id
			}));

			const { error: subcategoryError } = await supabase
				.from("product_subcategories")
				.insert(subcategoryRecords);

			if (subcategoryError) return errorResponse(subcategoryError.message);
		}

		// Insert variants
		if (variants?.length > 0) {
			const variantRecords = variants.map(variant => ({
				product_id: product.id,
				// Determine and add variant_type based on is_microfiber flag
				variant_type: is_microfiber ? 'microfiber' : 'liquid',
				...variant,
				stock: parseInt(variant.stock) || 0,
				price: parseFloat(variant.price) || 0
			}));

			// When storing in JSONB, no need to insert into a separate table
			// const { error: variantError } = await supabase
			// 	.from("product_variants")
			// 	.insert(variantRecords);

			// if (variantError) return errorResponse(variantError.message);
		}

		return NextResponse.json(
			{ success: true, product },
			{ status: 201 }
		);
	} catch (error) {
		return errorResponse(error.message);
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
			main_category_id,
			is_microfiber,
			main_image_url,
			images,
			variants,
			key_features,
			taglines,
			subcategories
		} = await request.json();

		// Update product
		const { error: productError } = await supabase
			.from("products")
			.update({
				product_code,
				name,
				description,
				main_category_id,
				is_microfiber,
				main_image_url,
				images: images || [],
				variants: variants?.map(variant => ({
					...variant,
					stock: parseInt(variant.stock) || 0,
					price: parseFloat(variant.price) || 0
				})) || [],
				key_features: key_features || [],
				taglines: taglines || [],
				updated_at: new Date().toISOString()
			})
			.eq("id", id);

		if (productError) return errorResponse(productError.message);

		// Update subcategories
		if (subcategories) {
			// Delete existing subcategories
			await supabase
				.from("product_subcategories")
				.delete()
				.eq("product_id", id);

			// Insert new subcategories
			if (subcategories.length > 0) {
				const subcategoryRecords = subcategories.map(category_id => ({
					product_id: id,
					category_id
				}));

				const { error: subcategoryError } = await supabase
					.from("product_subcategories")
					.insert(subcategoryRecords);

				if (subcategoryError) return errorResponse(subcategoryError.message);
			}
		}

		// Update variants
		if (variants) {
			// When storing in JSONB, no need to delete from a separate table first
			// await supabase
			// 	.from("product_variants")
			// 	.delete()
			// 	.eq("product_id", id);

			// Insert new variants (into the JSONB column of the products table)
			const updatedVariants = variants.map(variant => ({
				// Determine and add variant_type based on is_microfiber flag
				variant_type: is_microfiber ? 'microfiber' : 'liquid',
				...variant,
				stock: parseInt(variant.stock) || 0,
				price: parseFloat(variant.price) || 0
			}));

			// The update happens in the product update query above, saving to the variants JSONB column

			// if (variants.length > 0) {
			// 	const variantRecords = variants.map(variant => ({
			// 		product_id: id,
			// 		variant_type: is_microfiber ? 'microfiber' : 'liquid',
			// 		...variant
			// 	}));

			// 	const { error: variantError } = await supabase
			// 		.from("product_variants")
			// 		.insert(variantRecords);

			// 	if (variantError) return errorResponse(variantError.message);
			// }
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return errorResponse(error.message);
	}
}

// DELETE - Delete a product
export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) return errorResponse("ID is required", 400);

		const { error } = await supabase
			.from("products")
			.delete()
			.eq("id", id);

		if (error) return errorResponse(error.message);

		return NextResponse.json({ success: true });
	} catch (error) {
		return errorResponse(error.message);
	}
}
