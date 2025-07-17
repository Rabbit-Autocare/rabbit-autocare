import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ProductService } from '@/lib/service/productService';

export async function GET(request, { params }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Build the query to fetch product with variants
    let query = supabase.from('products').select(`
        *,
        product_variants (
          id,
          gsm,
          size,
          color,
          color_hex,
          quantity,
          unit,
          base_price,
          stock,
         compare_at_price
        )
      `);

    // Check if the id is numeric (database ID) or string (product code)
    if (!isNaN(id) && Number.isInteger(Number(id))) {
      query = query.eq('id', parseInt(id));
    } else {
      query = query.eq('product_code', id);
    }

    // Execute the query
    const { data: product, error } = await query.single();

    console.log('Supabase product fetch result:', {
      id,
      product: product
        ? {
            ...product,
            product_variants: product.product_variants?.map((v) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              stock: v.stock,
              base_price: v.base_price,
            })),
          }
        : null,
      error,
    });

    if (error) {
      console.error('Error fetching product:', error);

      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch product', details: error.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedProduct = {
      ...product,
      variants: product.product_variants || [],
      // Ensure backward compatibility
      category: product.category_name,
      subcategory: product.subcategory_name,
    };

    // Remove the product_variants key to avoid duplication
    delete transformedProduct.product_variants;

    // Apply the same transformation used by ProductService
    const finalProduct =
      ProductService.transformProductData(transformedProduct);

    // Debug: Log transformation result for microfiber products
    if (finalProduct?.product_type === 'microfiber') {
      console.log('🧽 API Transformation Result:', {
        name: finalProduct.name,
        variants: finalProduct.variants?.map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          stock: v.stock,
          base_price: v.base_price,
        })),
      });
    }

    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    const body = await request.json();
    // Destructure all fields, including images and main_image_url
    const {
      name,
      product_code,
      description,
      product_type,
      category,
      subcategory,
      hsn_code,
      features,
      usage_instructions,
      warnings,
      main_image_url,
      images,
      taglines,
      variants,
      // Add any other fields as needed
    } = body;
    // Create Supabase server client
    const supabase = await createSupabaseServerClient();
    // Update the product in the database, including images and main_image_url
    const { error } = await supabase
      .from('products')
      .update({
        name,
        product_code,
        description,
        product_type,
        category,
        subcategory,
        hsn_code,
        features,
        usage_instructions,
        warnings,
        main_image_url, // allow update/removal
        images,         // allow update/removal
        taglines,
        // Add any other fields as needed
      })
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Failed to update product', details: error.message }, { status: 500 });
    }
    // Optionally update variants if needed (not shown here)
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
