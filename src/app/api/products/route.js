import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET all products
export async function GET(request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);

    // Query parameters
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit'))
      : null;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset'))
      : 0;

    // Build query
    let query = supabase.from('products').select('*');

    // Apply filters if they exist
    if (category) query = query.eq('category', category);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (limit) query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const productData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.category) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      );
    }

    // Insert new product
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data[0],
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Create product API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
