import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { user_id, product_id } = await request.json();

    if (!user_id || !product_id) {
      return NextResponse.json(
        { error: "User ID and Product ID are required" },
        { status: 400 }
      );
    }

    // Check if item already exists in wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error checking wishlist" },
        { status: 500 }
      );
    }

    if (existingItem) {
      return NextResponse.json(
        { error: "Item already in wishlist" },
        { status: 400 }
      );
    }

    // Add item to wishlist
    const { data, error } = await supabase
      .from("wishlist")
      .insert([{ user_id, product_id }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to add item to wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
