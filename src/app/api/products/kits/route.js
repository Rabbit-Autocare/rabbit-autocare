import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    const { data: kits, error } = await supabase
      .from("kits")
      .select(`
        *,
        kit_products (
          *,
          product:products (*),
          variant:product_variants (*)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching kits:", error);
      return NextResponse.json({ error: "Failed to fetch kits" }, { status: 500 });
    }

    // Transform the data to include proper image URLs
    const transformedKits = kits.map(kit => ({
      ...kit,
      image_url: kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`,
      main_image_url: kit.main_image_url || kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`
    }));

    return NextResponse.json({ kits: transformedKits });
  } catch (error) {
    console.error("Error in kits API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
