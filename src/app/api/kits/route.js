import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (kits): ${message}`);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get a specific kit with its related products
      const { data: kit, error: kitError } = await supabase
        .from("kits")
        .select("*")
        .eq("id", id)
        .single();

      if (kitError) return errorResponse(kitError.message);

      const { data: kitProducts, error: productsError } = await supabase
        .from("kit_products")
        .select(`
          product_id,
          variant_id,
          quantity,
          products:products(*)
        `)
        .eq("kit_id", id);

      if (productsError) return errorResponse(productsError.message);

      return NextResponse.json({
        kit,
        products: kitProducts
      });
    }

    // Get all kits
    const { data: kits, error } = await supabase
      .from("kits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message);

    return NextResponse.json({ kits });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { name, description, image_url, original_price, price, discount_percent, products } = await request.json();

    if (!name) return errorResponse("Name is required", 400);
    if (!Array.isArray(products) || products.length === 0)
      return errorResponse("At least one product must be selected", 400);

    // Begin transaction with kit creation
    const { data: kit, error: kitError } = await supabase
      .from("kits")
      .insert([{
        name,
        description,
        image_url,
        original_price: parseFloat(original_price) || 0,
        price: parseFloat(price) || 0,
        discount_percent: parseFloat(discount_percent) || 0
      }])
      .select()
      .single();

    if (kitError) return errorResponse(kitError.message);

    // Add products to the kit
    const kitProductEntries = products.map(product => ({
      kit_id: kit.id,
      product_id: product.product_id,
      variant_id: product.variant_id,
      quantity: product.quantity || 1
    }));

    const { error: productError } = await supabase
      .from("kit_products")
      .insert(kitProductEntries);

    if (productError) return errorResponse(productError.message);

    return NextResponse.json({ success: true, kit });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID is required", 400);

    const { error } = await supabase
      .from("kits")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error.message);
  }
}
