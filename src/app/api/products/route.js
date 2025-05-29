import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - Fetch all products or a specific product
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const category = searchParams.get("category");
		const limit = searchParams.get("limit");

		let query = supabase.from("products").select("*");

		// If specific product ID is requested
		if (id) {
			const { data, error } = await query.eq("id", id).single();

			if (error) {
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "Product not found" },
						{ status: 404 },
					);
				}
				throw new Error(error.message);
			}

			return NextResponse.json({
				success: true,
				product: data,
			});
		}

		// Filter by category if provided
		if (category) {
			query = query.eq("category", category);
		}

		// Apply limit if provided
		if (limit) {
			query = query.limit(parseInt(limit));
		}

		// Order by created_at descending
		query = query.order("created_at", { ascending: false });

		const { data, error } = await query;

		if (error) {
			throw new Error(error.message);
		}

		return NextResponse.json({
			success: true,
			products: data || [],
			count: data?.length || 0,
		});
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to fetch products" },
			{ status: 500 },
		);
	}
}

// POST - Create a new product
export async function POST(request) {
	try {
		const productData = await request.json();

		// Validate required fields
		const requiredFields = [
			"id",
			"name",
			"category",
			"variant_type",
			"variants",
		];
		const missingFields = requiredFields.filter((field) => !productData[field]);

		if (missingFields.length > 0) {
			return NextResponse.json(
				{ error: `Missing required fields: ${missingFields.join(", ")}` },
				{ status: 400 },
			);
		}

		// Validate category
		const validCategories = [
			"car interior",
			"car exterior",
			"microfiber cloth",
		];
		if (!validCategories.includes(productData.category)) {
			return NextResponse.json(
				{
					error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Validate variant_type
		const validVariantTypes = ["quantity", "size"];
		if (!validVariantTypes.includes(productData.variant_type)) {
			return NextResponse.json(
				{
					error: `Invalid variant_type. Must be one of: ${validVariantTypes.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Validate variants structure
		if (
			!Array.isArray(productData.variants) ||
			productData.variants.length === 0
		) {
			return NextResponse.json(
				{ error: "Variants must be a non-empty array" },
				{ status: 400 },
			);
		}

		// Validate each variant
		for (const variant of productData.variants) {
			if (!variant.value || !variant.price) {
				return NextResponse.json(
					{ error: "Each variant must have value and price" },
					{ status: 400 },
				);
			}

			// For microfiber products, validate additional fields
			if (productData.category === "microfiber cloth") {
				if (!variant.color || !variant.gsm) {
					return NextResponse.json(
						{
							error:
								"Microfiber products must have color and GSM for each variant",
						},
						{ status: 400 },
					);
				}
			}
		}

		// Check if product ID already exists
		const { data: existingProduct } = await supabase
			.from("products")
			.select("id")
			.eq("id", productData.id)
			.single();

		if (existingProduct) {
			return NextResponse.json(
				{ error: "Product with this ID already exists" },
				{ status: 409 },
			);
		}

		// Prepare the product object for insertion
		const product = {
			id: productData.id,
			name: productData.name,
			description: productData.description || "",
			key_features: productData.key_features || [],
			category: productData.category,
			variant_type: productData.variant_type,
			variants: productData.variants,
			image: productData.image || [],
		};

		// Insert the product into the database
		const { data, error } = await supabase
			.from("products")
			.insert([product])
			.select();

		if (error) {
			console.error("Supabase insert error:", error);
			throw new Error(error.message);
		}

		return NextResponse.json(
			{
				success: true,
				message: "Product created successfully",
				product: data[0],
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create product" },
			{ status: 500 },
		);
	}
}

// PUT - Update an existing product
export async function PUT(request) {
	try {
		const { id, ...updateData } = await request.json();

		if (!id) {
			return NextResponse.json(
				{ error: "Product ID is required" },
				{ status: 400 },
			);
		}

		// Check if product exists
		const { data: existingProduct, error: fetchError } = await supabase
			.from("products")
			.select("*")
			.eq("id", id)
			.single();

		if (fetchError) {
			if (fetchError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Product not found" },
					{ status: 404 },
				);
			}
			throw new Error(fetchError.message);
		}

		// Validate category if provided
		if (updateData.category) {
			const validCategories = [
				"car interior",
				"car exterior",
				"microfiber cloth",
			];
			if (!validCategories.includes(updateData.category)) {
				return NextResponse.json(
					{
						error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
					},
					{ status: 400 },
				);
			}
		}

		// Validate variant_type if provided
		if (updateData.variant_type) {
			const validVariantTypes = ["quantity", "size"];
			if (!validVariantTypes.includes(updateData.variant_type)) {
				return NextResponse.json(
					{
						error: `Invalid variant_type. Must be one of: ${validVariantTypes.join(", ")}`,
					},
					{ status: 400 },
				);
			}
		}

		// Validate variants if provided
		if (updateData.variants) {
			if (
				!Array.isArray(updateData.variants) ||
				updateData.variants.length === 0
			) {
				return NextResponse.json(
					{ error: "Variants must be a non-empty array" },
					{ status: 400 },
				);
			}

			// Validate each variant
			for (const variant of updateData.variants) {
				if (!variant.value || !variant.price) {
					return NextResponse.json(
						{ error: "Each variant must have value and price" },
						{ status: 400 },
					);
				}
			}
		}

		// Prepare update object (only include provided fields)
		const productUpdate = {};
		const allowedFields = [
			"name",
			"description",
			"key_features",
			"category",
			"variant_type",
			"variants",
			"image",
		];

		allowedFields.forEach((field) => {
			if (updateData.hasOwnProperty(field)) {
				productUpdate[field] = updateData[field];
			}
		});

		// Update the product
		const { data, error } = await supabase
			.from("products")
			.update(productUpdate)
			.eq("id", id)
			.select();

		if (error) {
			console.error("Supabase update error:", error);
			throw new Error(error.message);
		}

		return NextResponse.json({
			success: true,
			message: "Product updated successfully",
			product: data[0],
		});
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to update product" },
			{ status: 500 },
		);
	}
}

// DELETE - Delete a product
export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Product ID is required" },
				{ status: 400 },
			);
		}

		// Check if product exists
		const { data: existingProduct, error: fetchError } = await supabase
			.from("products")
			.select("id")
			.eq("id", id)
			.single();

		if (fetchError) {
			if (fetchError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Product not found" },
					{ status: 404 },
				);
			}
			throw new Error(fetchError.message);
		}

		// Delete the product
		const { error } = await supabase.from("products").delete().eq("id", id);

		if (error) {
			console.error("Supabase delete error:", error);
			throw new Error(error.message);
		}

		return NextResponse.json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to delete product" },
			{ status: 500 },
		);
	}
}
