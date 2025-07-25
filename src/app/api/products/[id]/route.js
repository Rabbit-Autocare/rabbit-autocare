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
          updated_at,
          pack_size,
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

    if (error) {
      console.error('Error fetching product:', error);

      if (error.code === 'PGRST116') {
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
      category: product.category_name,
      subcategory: product.subcategory_name,
    };

    delete transformedProduct.product_variants;

    const finalProduct = ProductService.transformProductData(transformedProduct);

    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    console.log('📝 PUT request body:', body);

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
    } = body;

    const supabase = await createSupabaseServerClient();

    // Start a transaction-like operation
    // 1. Update the main product
    const { data: updatedProduct, error: productError } = await supabase
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
        main_image_url,
        images,
        taglines,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('Error updating product:', productError);
      return NextResponse.json({ 
        error: 'Failed to update product', 
        details: productError.message 
      }, { status: 500 });
    }

    // 2. Handle variants update if provided
    if (variants && Array.isArray(variants)) {
      console.log('📝 Updating variants:', variants);

      // Get existing variants
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id);

      const existingVariantIds = existingVariants?.map(v => v.id) || [];
      const incomingVariantIds = variants.filter(v => v.id).map(v => v.id);

      // Delete variants that are no longer in the update
      const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
      if (variantsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .in('id', variantsToDelete);

        if (deleteError) {
          console.error('Error deleting variants:', deleteError);
        }
      }

      // Update or insert variants
      for (const variant of variants) {
        const variantData = {
          product_id: id,
          variant_code: variant.variant_code,
          size: variant.size,
          quantity: variant.quantity,
          unit: variant.unit,
          weight_grams: variant.weight_grams,
          gsm: variant.gsm,
          dimensions: variant.dimensions,
          color: variant.color,
          color_hex: variant.color_hex,
          base_price: variant.base_price,
          base_price_excluding_gst: variant.base_price_excluding_gst,
          stock: variant.stock,
          is_active: variant.is_active,
          pack_size: variant.pack_size,
          updated_at: new Date().toISOString(),
        };

        if (variant.id) {
          // Update existing variant
          const { error: variantError } = await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', variant.id);

          if (variantError) {
            console.error('Error updating variant:', variantError);
          }
        } else {
          // Insert new variant
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({ ...variantData, created_at: new Date().toISOString() });

          if (variantError) {
            console.error('Error inserting variant:', variantError);
          }
        }
      }
    }

    // 3. Fetch the complete updated product with variants
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
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
          updated_at,
          pack_size
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated product:', fetchError);
      return NextResponse.json({ 
        error: 'Product updated but failed to fetch updated data', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // Transform the response data
    const transformedProduct = {
      ...completeProduct,
      variants: completeProduct.product_variants || [],
    };
    delete transformedProduct.product_variants;

    console.log('✅ Product updated successfully:', transformedProduct.name);

    return NextResponse.json({ 
      success: true, 
      product: transformedProduct 
    });

  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Delete variants first (due to foreign key constraint)
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (variantsError) {
      console.error('Error deleting product variants:', variantsError);
      return NextResponse.json({ 
        error: 'Failed to delete product variants', 
        details: variantsError.message 
      }, { status: 500 });
    }

    // Delete the product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productError) {
      console.error('Error deleting product:', productError);
      return NextResponse.json({ 
        error: 'Failed to delete product', 
        details: productError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
