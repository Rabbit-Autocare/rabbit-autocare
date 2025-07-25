export const runtime = 'nodejs' // Add this line

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getServerAuth } from "@/lib/auth/server-auth";

export async function DELETE(request) {
  try {
    // Use custom authentication
    const { success, user } = await getServerAuth();
    if (!success || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const product_id = searchParams.get("product_id");
    const combo_id = searchParams.get("combo_id");
    const kit_id = searchParams.get("kit_id");

    if (!id && !product_id && !combo_id && !kit_id) {
      return NextResponse.json(
        { error: "At least one of id, Product ID, Combo ID, or Kit ID is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("wishlist_items").delete().eq("user_id", user.id);

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
      console.error('Wishlist delete error:', error);
      return NextResponse.json(
        { error: "Failed to remove item from wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
