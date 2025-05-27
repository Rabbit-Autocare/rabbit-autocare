import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

// Delete a product by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Delete related cart items
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .eq('product_id', id);

    if (cartItemsError) {
      console.error('Error deleting cart items:', cartItemsError);
      return NextResponse.json(
        { error: `Failed to delete cart items: ${cartItemsError.message}` },
        { status: 500 }
      );
    }

    // Step 2: Delete related wishlist items
    const { error: wishlistItemsError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('product_id', id);

    if (wishlistItemsError) {
      console.error('Error deleting wishlist items:', wishlistItemsError);
      return NextResponse.json(
        {
          error: `Failed to delete wishlist items: ${wishlistItemsError.message}`,
        },
        { status: 500 }
      );
    }

    // Step 3: Delete related order items (if any exist)
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('product_id', id);

    if (orderItemsError) {
      console.error('Error deleting order items:', orderItemsError);
      return NextResponse.json(
        { error: `Failed to delete order items: ${orderItemsError.message}` },
        { status: 500 }
      );
    }

    // Step 4: Finally delete the product
    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productDeleteError) {
      console.error('Error deleting product:', productDeleteError);
      return NextResponse.json(
        { error: `Failed to delete product: ${productDeleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product and all related items deleted successfully',
    });
  } catch (error) {
    console.error('Error in product deletion process:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// Get a single product by ID
export async function GET(request, { params }) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
