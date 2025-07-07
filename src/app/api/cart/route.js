// app/api/cart/route.js
import { NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

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
      .select(
        `
        *,
        product:products (
          id,
          name,
          main_image_url,
          variants
        )
      `
      )
      .order('created_at', { ascending: false });

    if (cartError) {
      return errorResponse(cartError.message);
    }

    return NextResponse.json({
      success: true,
      cartItems: cartItems || [],
    });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

// POST - Add item to cart
export async function POST(request) {
  try {
    const { product_id, variant, quantity = 1, user_id } = await request.json();

    // Validate required fields
    if (!product_id || !variant || !user_id) {
      return errorResponse(
        'Missing required fields: product_id, variant, user_id',
        400
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return errorResponse('Product not found', 404);
    }

    // Check for existing cart item with same product and variant
    const { data: existingItems, error: searchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id);

    if (searchError) {
      return errorResponse(searchError.message);
    }

    // Find matching variant
    const existingItem = existingItems?.find((item) => {
      // Strategy 1: If variant has ID, compare by ID
      if (variant.id && item.variant?.id) {
        return item.variant.id === variant.id;
      }

      // Strategy 2: Compare key properties for microfiber products
      if (variant.size && variant.color) {
        return (
          item.variant?.size === variant.size &&
          item.variant?.color === variant.color
        );
      }

      // Strategy 3: Compare key properties for liquid products
      if (variant.quantity && variant.unit) {
        return (
          item.variant?.quantity === variant.quantity &&
          item.variant?.unit === variant.unit
        );
      }

      return false;
    });

    let result;

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;

      result = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();
    } else {
      // Create new cart item if doesn't exist
      const cartItem = {
        user_id,
        product_id,
        variant,
        quantity,
        created_at: new Date().toISOString(),
      };

      result = await supabase
        .from('cart_items')
        .insert([cartItem])
        .select()
        .single();
    }

    if (result.error) {
      return errorResponse(result.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        cartItem: result.data,
        message: existingItem
          ? 'Cart item quantity updated'
          : 'Item added to cart successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

// PUT - Update cart item quantity
export async function PUT(request) {
  try {
    const { cart_item_id, quantity } = await request.json();

    if (!cart_item_id || !quantity || quantity < 1) {
      return errorResponse('Invalid cart item ID or quantity', 400);
    }

    // Update cart item
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity: quantity,
        updated_at: new Date().toISOString(),
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
      message: 'Cart item updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/cart error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

// DELETE - Remove item from cart
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cart_item_id = searchParams.get('id');

    if (!cart_item_id) {
      return errorResponse('Cart item ID is required', 400);
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
      message: 'Cart item removed successfully',
    });
  } catch (error) {
    console.error('DELETE /api/cart error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}
