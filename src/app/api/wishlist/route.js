export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getServerAuth } from "@/lib/auth/server-auth";

export async function GET(request) {
  try {
    console.log('🔐 Wishlist API: Checking authentication...');

    const { success, user } = await getServerAuth();
    console.log('🔐 Auth result:', { success, userId: user?.id });

    if (!success || !user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { error: "Authentication required", success: false },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    console.log('📦 Fetching wishlist for user:', user.id);

    const { data: wishlist, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: "Failed to fetch wishlist", success: false },
        { status: 500 }
      );
    }

    console.log('📋 Raw wishlist items:', wishlist?.length || 0, 'items found');

    // Fetch product details for items with product_id
    const productIds = wishlist.filter(item => item.product_id).map(item => item.product_id);
    let productsMap = {};

    if (productIds.length > 0) {
      console.log('🛍️ Fetching product details for IDs:', productIds);

      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .in("id", productIds);

      if (!prodError && products) {
        productsMap = Object.fromEntries(products.map(p => [p.id, p]));
        console.log('🛍️ Products fetched:', Object.keys(productsMap).length);
      } else if (prodError) {
        console.error('❌ Products fetch error:', prodError);
      }
    }

    // Attach product details to wishlist items
    const result = wishlist.map(item => {
      if (item.product_id && productsMap[item.product_id]) {
        return { ...item, products: productsMap[item.product_id] };
      }
      return item;
    });

    console.log('✅ Final result prepared with', result.length, 'items');
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('💥 Wishlist API error:', error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
