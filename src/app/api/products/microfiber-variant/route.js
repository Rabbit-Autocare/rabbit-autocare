// /app/api/products/microfiber-variant/route.js
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

		let query = supabase.from("microfiber_variants").select(`
				*,
				gsm_variant:gsm_variants(id, gsm_value, product_id),
				color:colors(id, name),
				size:sizes(id, size_cm)
			`);

		if (product_id) {
			query = query.eq("gsm_variant.product_id", product_id);
		}

		const { data, error } = await query;
		if (error) return errorResponse(error.message);

		return NextResponse.json({ success: true, microfiberVariants: data });
	} catch (error) {
		return errorResponse(error.message);
	}
}

export async function POST(request) {
	try {
		const { gsm_id, color_id, size_id, stock, price } = await request.json();
		if (!gsm_id || !color_id || !size_id || stock == null || !price) {
			return errorResponse("Missing required fields", 400);
		}

		const { data, error } = await supabase
			.from("microfiber_variants")
			.insert([{ gsm_id, color_id, size_id, stock, price }])
			.select(`
				*,
				gsm_variant:gsm_variants(id, gsm_value, product_id),
				color:colors(id, name),
				size:sizes(id, size_cm)
			`);
		if (error) return errorResponse(error.message);

		return NextResponse.json(
			{ success: true, microfiberVariant: data[0] },
			{ status: 201 },
		);
	} catch (error) {
		return errorResponse(error.message);
	}
}

export async function PUT(request) {
	try {
		const { id, stock, price } = await request.json();
		if (!id) return errorResponse("ID is required", 400);

		const { data, error } = await supabase
			.from("microfiber_variants")
			.update({ stock, price })
			.eq("id", id)
			.select(`
				*,
				gsm_variant:gsm_variants(id, gsm_value, product_id),
				color:colors(id, name),
				size:sizes(id, size_cm)
			`);
		if (error) return errorResponse(error.message);

		return NextResponse.json({ success: true, microfiberVariant: data[0] });
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
			.from("microfiber_variants")
			.delete()
			.eq("id", id);
		if (error) return errorResponse(error.message);

		return NextResponse.json({
			success: true,
			message: "Microfiber variant deleted",
		});
	} catch (error) {
		return errorResponse(error.message);
	}
}
