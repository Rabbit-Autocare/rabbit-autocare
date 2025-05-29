import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Add a new product
export async function POST(request) {
  try {
    const productData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.category) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      );
    }

    // Prepare the product object for insertion
    const product = {
      name: productData.name,
      description: productData.description || '',
      category: productData.category,
      image: productData.image || null,
      variants: productData.variants || [],
      created_at: new Date().toISOString(),
      // Don't include updated_at for new products
    };

    // Insert the product into the database
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      product: data[0],
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add product' },
      { status: 500 }
    );
  }
}

// Update an existing product
export async function PUT(request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Remove updated_at from the update data to avoid schema errors
    const productUpdate = {
      name: updateData.name,
      description: updateData.description || '',
      category: updateData.category,
      image: updateData.image || null,
      variants: updateData.variants || [],
      // Don't include updated_at
    };

    const { data, error } = await supabase
      .from('products')
      .update(productUpdate)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: data[0],
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
