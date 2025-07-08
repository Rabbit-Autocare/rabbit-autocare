// /app/api/products/route.js
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ProductService } from '@/lib/service/productService';

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (products): ${message}`);
  return NextResponse.json({ error: message }, { status });
}

// GET - Fetch products with optional filtering
export async function GET(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const inStock = searchParams.getAll('inStock[]');
    const sizes = searchParams.getAll('sizes[]');
    const colors = searchParams.getAll('colors[]');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Start building the query with proper join
    let query = supabase.from('products').select(
      `
				*,
				product_variants (
					id,
					variant_code,
					gsm,
					size,
					color,
					color_hex,
					quantity,
					unit,
					base_price,
					base_price_excluding_gst,
					stock
				)
			`,
      { count: 'exact' }
    );

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
    }

    if (inStock.length > 0) {
      query = query.eq('in_stock', inStock.includes('true'));
    }

    if (sizes.length > 0) {
      query = query.in('product_variants.size', sizes);
    }

    if (colors.length > 0) {
      query = query.in('product_variants.color', colors);
    }

    if (minPrice) {
      query = query.gte('product_variants.base_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('product_variants.base_price', parseFloat(maxPrice));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => {
      const baseProduct = {
        ...product,
        variants: product.product_variants || [],
      };
      // Remove the product_variants key to avoid duplication
      delete baseProduct.product_variants;

      // Apply the same transformation used by ProductService
      const transformed = ProductService.transformProductData(baseProduct);

      // Debug: Log transformation for microfiber products
      if (transformed?.product_type === 'microfiber') {
        console.log('🧽 API List Transformation:', {
          name: transformed.name,
          variantCount: transformed.variants?.length,
          stockValues: transformed.variants?.map((v) => v.stock),
        });
      }

      return transformed;
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total: count,
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const data = await request.json();
    console.log('Received product data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name || !data.product_code) {
      return NextResponse.json(
        { error: 'Product name and code are required' },
        { status: 400 }
      );
    }

    if (
      !data.variants ||
      !Array.isArray(data.variants) ||
      data.variants.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one variant is required' },
        { status: 400 }
      );
    }

    // Validate variant data
    for (const variant of data.variants) {
      if (data.is_microfiber) {
        if (
          !variant.gsm ||
          !variant.size ||
          !variant.color ||
          !variant.base_price
        ) {
          return NextResponse.json(
            {
              error:
                'GSM, size, color, and base price are required for microfiber variants',
            },
            { status: 400 }
          );
        }
      } else {
        // Optional fields for liquid variants
        if (!variant.base_price) {
          return NextResponse.json(
            { error: 'Base price is required for regular (liquid) variants' },
            { status: 400 }
          );
        }
      }
    }

    // Prepare the product data
    const productData = {
      name: data.name,
      product_code: data.product_code,
      description: data.description,
      product_type: data.product_type,
      category: data.category,
      subcategory: data.subcategory,
      hsn_code: data.hsn_code,
      features: data.features,
      usage_instructions: data.usage_instructions,
      warnings: data.warnings,
      main_image_url: data.main_image_url,
      images: data.images,
      taglines: data.taglines,
    };

    // Log the prepared product data
    console.log(
      'Prepared product data for insert:',
      JSON.stringify(productData, null, 2)
    );

    // Insert the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', {
        error: productError,
        message: productError.message,
        details: productError.details,
        hint: productError.hint,
        code: productError.code,
      });
      return NextResponse.json(
        { error: `Failed to create product: ${productError.message}` },
        { status: 500 }
      );
    }

    // Prepare variants, ensuring the client-generated text ID is included
    const variantsToInsert = data.variants.map((variant) => ({
      ...variant,
      product_id: product.id, // This is an integer
    }));

    // Insert the variants
    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (variantsError) {
      // Rollback product creation on variant failure
      await supabase.from('products').delete().eq('id', product.id);
      return errorResponse(
        `Failed to create variants: ${variantsError.message}`
      );
    }

    // Fetch and return the complete product (with variants) after creation
    // Remove 'compare_at_price' from the select
    const { data: fullProduct, error: fetchError } = await supabase
      .from('products')
      .select(
        `
        *,
        product_variants (
          id,
          product_id,
          variant_code,
          size,
          quantity,
          unit,
          weight_grams,
          gsm,
          dimensions,
          color,
          color_hex,
          base_price,
          base_price_excluding_gst,
          stock,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq('id', product.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete product:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch complete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: fullProduct });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing product
export async function PUT(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const data = await request.json();
    const { id, variants, ...productData } = data;

    if (!id) {
      return errorResponse('Product ID is required for update', 400);
    }

    // Update the core product details
    const { error: productUpdateError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id);

    if (productUpdateError) {
      return errorResponse(
        `Failed to update product: ${productUpdateError.message}`
      );
    }

    // Perform a smart "upsert" for all variants.
    // This will update existing variants and insert new ones based on the 'id' field.
    if (variants && Array.isArray(variants)) {
      const { error: upsertError } = await supabase
        .from('product_variants')
        .upsert(
          variants.map((v) => ({ ...v, product_id: id })),
          { onConflict: 'id' }
        );

      if (upsertError) {
        return errorResponse(
          `Failed to upsert variants: ${upsertError.message}`
        );
      }
    }

    // Fetch the complete product with its updated variants
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(
        `
				*,
				product_variants (*)
			`
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      return errorResponse(
        `Failed to fetch updated product: ${fetchError.message}`
      );
    }

    return NextResponse.json({
      success: true,
      product: completeProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/products error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

// DELETE - Delete a product
export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Delete variants first
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (variantsError) {
      console.error('Error deleting variants:', variantsError);
      return NextResponse.json(
        { error: 'Failed to delete product variants' },
        { status: 500 }
      );
    }

    // Delete product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productError) {
      console.error('Error deleting product:', productError);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
