export const runtime = 'nodejs' // Add this line

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getServerAuth } from "@/lib/auth/server-auth";

export async function POST(request) {
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
    const { product_id, variant, combo_id, kit_id } = await request.json();

    if (!product_id && !combo_id && !kit_id) {
      return NextResponse.json(
        { error: "At least one of Product ID, Combo ID, or Kit ID is required" },
        { status: 400 }
      );
    }

    // Check for existing item (your existing logic)
    let existingItem = null;
    if (combo_id) {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("combo_id", combo_id)
        .single();
      if (!error && data) existingItem = data;
    } else if (kit_id) {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("kit_id", kit_id)
        .single();
      if (!error && data) existingItem = data;
    } else if (product_id) {
      // Your existing variant comparison logic
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product_id);
      if (!error && data && data.length > 0) {
        const normalizeVariant = (v) => {
          if (!v) return null;
          const normalized = {};
          if (v.id) normalized.id = v.id;
          if (v.size) normalized.size = v.size;
          if (v.color) normalized.color = v.color;
          if (v.quantity_value) normalized.quantity_value = v.quantity_value;
          if (v.unit) normalized.unit = v.unit;
          if (v.gsm) normalized.gsm = v.gsm;
          if (v.is_package !== undefined) normalized.is_package = v.is_package;
          if (v.package_quantity) normalized.package_quantity = v.package_quantity;
          return normalized;
        };
        const normalizedSearchVariant = normalizeVariant(variant);
        existingItem = data.find(item => {
          const normalizedItemVariant = normalizeVariant(item.variant);
          return JSON.stringify(normalizedItemVariant) === JSON.stringify(normalizedSearchVariant);
        }) || null;
      }
    }

    if (existingItem) {
      return NextResponse.json(
        { error: "Item already in wishlist" },
        { status: 400 }
      );
    }

    // Add item to wishlist_items
    const wishlistItem = {
      user_id: user.id, // Use authenticated user ID
      product_id: product_id || null,
      variant: product_id ? variant : (combo_id || kit_id ? variant : null),
      combo_id: combo_id || null,
      kit_id: kit_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (wishlistItem.product_id && typeof wishlistItem.product_id !== 'number') {
      wishlistItem.product_id = null;
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert([wishlistItem])
      .select()
      .single();

    if (error) {
      console.error('Wishlist insert error:', error);
      return NextResponse.json(
        { error: "Failed to add item to wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
