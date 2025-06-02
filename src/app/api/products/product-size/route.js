// /app/api/products/product-size/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const product_id = searchParams.get("product_id");

		let query = supabase.from("product_sizes").select(`
			*,
			product:products(id, product_code, name)
		`);
		if (product_id) {
			query = query.eq("product_id", product_id);
		}

		const { data, error } = await query.order("quantity");
		if (error) return errorResponse(error.message);

		return NextResponse.json({ success: true, productSizes: data });
	} catch (error) {
		return errorResponse(error.message);
	}
}

export async function POST(request) {
	try {
		const { product_id, quantity, unit, price, stock } = await request.json();
		if (!product_id || !quantity || !unit || !price) {
			return errorResponse("Missing required fields", 400);
		}

		const { data, error } = await supabase
			.from("product_sizes")
			.insert([{
				product_id,
				quantity,
				unit,
				price,
				stock: stock || 0
			}])
			.select(`
				*,
				product:products(id, product_code, name)
			`);
		if (error) return errorResponse(error.message);

		return NextResponse.json(
			{ success: true, productSize: data[0] },
			{ status: 201 },
		);
	} catch (error) {
		return errorResponse(error.message);
	}
}

export async function PUT(request) {
	try {
		const { id, quantity, unit, price, stock } = await request.json();
		if (!id) return errorResponse("ID is required", 400);

		const { data, error } = await supabase
			.from("product_sizes")
			.update({ quantity, unit, price, stock })
			.eq("id", id)
			.select(`
				*,
				product:products(id, product_code, name)
			`);
		if (error) return errorResponse(error.message);

		return NextResponse.json({ success: true, productSize: data[0] });
	} catch (error) {
		return errorResponse(error.message);
	}
}

export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) return errorResponse("ID is required", 400);

		const { error } = await supabase
			.from("product_sizes")
			.delete()
			.eq("id", id);
		if (error) return errorResponse(error.message);

		return NextResponse.json({
			success: true,
			message: "Product size deleted",
		});
	} catch (error) {
		return errorResponse(error.message);
	}
}
