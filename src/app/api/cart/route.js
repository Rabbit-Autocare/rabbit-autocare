// app/api/cart/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (cart): ${message}`);
  return NextResponse.json({ error: message }, { status });
}

// GET - Fetch cart items
export async function GET(request) {
  try {
    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products (
          id,
          name,
          main_image_url,
          variants
        )
      `)
      .order('created_at', { ascending: false });

    if (cartError) {
      return errorResponse(cartError.message);
    }

    return NextResponse.json({
      success: true,
      cartItems: cartItems || []
    });

  } catch (error) {
    console.error("GET /api/cart error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// POST - Add item to cart
export async function POST(request) {
  try {
    const { product_id, variant, quantity = 1 } = await request.json();

    // Validate required fields
    if (!product_id || !variant) {
      return errorResponse("Missing required fields: product_id, variant", 400);
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return errorResponse("Product not found", 404);
    }

    // Create cart item
    const cartItem = {
      product_id,
      variant,
      quantity,
      created_at: new Date().toISOString()
    };

    // Try to insert with upsert
    const { data: newItem, error: insertError } = await supabase
      .from('cart_items')
      .upsert([cartItem], {
        onConflict: variant.variant_type === 'liquid' ?
          'product_id,variant->quantity' :
          'product_id,variant->color,variant->size'
      })
      .select()
      .single();

    if (insertError) {
      return errorResponse(insertError.message);
    }

    return NextResponse.json({
      success: true,
      cartItem: newItem,
      message: "Item added to cart successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/cart error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// PUT - Update cart item quantity
export async function PUT(request) {
  try {
    const { cart_item_id, quantity } = await request.json();

    if (!cart_item_id || !quantity || quantity < 1) {
      return errorResponse("Invalid cart item ID or quantity", 400);
    }

    // Update cart item
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity: quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart_item_id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(updateError.message);
    }

    return NextResponse.json({
      success: true,
      cartItem: updatedItem,
      message: "Cart item updated successfully"
    });

  } catch (error) {
    console.error("PUT /api/cart error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}

// DELETE - Remove item from cart
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cart_item_id = searchParams.get("id");

    if (!cart_item_id) {
      return errorResponse("Cart item ID is required", 400);
    }

    // Delete cart item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cart_item_id);

    if (deleteError) {
      return errorResponse(deleteError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Cart item removed successfully"
    });

  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return errorResponse(error.message || "Internal server error");
  }
}
