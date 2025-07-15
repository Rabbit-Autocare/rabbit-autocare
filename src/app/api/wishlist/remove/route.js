import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const id = searchParams.get("id");
    const product_id = searchParams.get("product_id");
    const combo_id = searchParams.get("combo_id");
    const kit_id = searchParams.get("kit_id");

    if (!user_id || (!id && !product_id && !combo_id && !kit_id)) {
      return NextResponse.json(
        { error: "User ID and at least one of id, Product ID, Combo ID, or Kit ID is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("wishlist_items").delete().eq("user_id", user_id);
    if (id) {
      query = query.eq("id", id);
    } else if (combo_id) {
      query = query.eq("combo_id", combo_id);
    } else if (kit_id) {
      query = query.eq("kit_id", kit_id);
    } else if (product_id) {
      query = query.eq("product_id", product_id);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to remove item from wishlist" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
