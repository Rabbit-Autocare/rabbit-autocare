import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (coupons): ${message}`);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get a specific coupon
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return errorResponse(error.message);

      return NextResponse.json({ coupon });
    }

    // Get all coupons
    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message);

    return NextResponse.json({ coupons });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { code, discount_percent, valid_from, valid_until, max_uses, is_active } = await request.json();

    if (!code) return errorResponse("Code is required", 400);
    if (!discount_percent) return errorResponse("Discount percent is required", 400);

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert([{
        code,
        discount_percent: parseFloat(discount_percent),
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null,
        max_uses: max_uses || null,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();

    if (error) return errorResponse(error.message);

    return NextResponse.json({ success: true, coupon });
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
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) return errorResponse(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error.message);
  }
}
