import { NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

export async function GET() {
  try {
    console.log('Starting to fetch products from Supabase...');

    // Fetch products with their variants
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        product_code,
        name,
        description,
        category_name,
        is_microfiber,
        main_image_url,
        images,
        key_features,
        taglines,
        variants:product_variants(
          id,
          product_id,
          gsm,
          size,
          color,
          color_hex,
          quantity,
          unit,
          price,
          stock,
          compare_at_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Raw products data:', products);

    if (!products || products.length === 0) {
      console.log('No products found in the database');
      return NextResponse.json([]);
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => {
      try {
        return {
          id: product.id,
          product_code: product.product_code,
          name: product.name,
          heading: product.name,
          description: product.description,
          main_image_url: product.main_image_url,
          thumbnails: product.images || [product.main_image_url],
          mrp: product.variants?.[0]?.price || 0,
          rating: 4, // Default rating
          totalRatings: 12, // Default total ratings
          is_microfiber: product.is_microfiber || false,
          key_features: product.key_features || [],
          taglines: product.taglines || [],
          variants: (product.variants || []).map(variant => ({
            id: variant.id,
            gsm: variant.gsm,
            size: variant.size,
            color: variant.color,
            color_hex: variant.color_hex,
            quantity: variant.quantity,
            unit: variant.unit,
            price: variant.price,
            stock: variant.stock,
            compare_at_price: variant.compare_at_price
          }))
        };
      } catch (transformError) {
        console.error('Error transforming product:', product, transformError);
        throw transformError;
      }
    });

    console.log('Transformed products:', transformedProducts);
    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Detailed error in featured products API:', {
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error.message
      },
      { status: 500 }
    );
  }
}
