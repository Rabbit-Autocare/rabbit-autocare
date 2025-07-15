import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch all wishlist items for the user
    const { data: wishlist, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch wishlist" },
        { status: 500 }
      );
    }

    // For items with product_id, fetch product details
    const productIds = wishlist.filter(item => item.product_id).map(item => item.product_id);
    let productsMap = {};
    if (productIds.length > 0) {
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .in("id", productIds);
      if (!prodError && products) {
        productsMap = Object.fromEntries(products.map(p => [p.id, p]));
      }
    }

    // Attach product details to wishlist items
    const result = wishlist.map(item => {
      if (item.product_id && productsMap[item.product_id]) {
        return { ...item, products: productsMap[item.product_id] };
      }
      return item;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
