import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const product_id = searchParams.get("product_id");

    if (!user_id || !product_id) {
      return NextResponse.json(
        { error: "User ID and Product ID are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user_id)
      .eq("product_id", product_id);

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
