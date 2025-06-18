// /app/api/products/by-category/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sort = searchParams.get("sort") || "popularity";

    if (!categorySlug) return errorResponse("Missing category slug", 400);

    // Single query with proper join using the foreign key relationship
    const { data: products, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        popularity_score,
        created_at,
        updated_at,
        main_category_id,
        product_code,
        is_microfiber,
        main_image_url,
        images,
        key_features,
        taglines,
        subcategory_names,
        categories!main_category_id (
          id,
          name,
          slug,
          description
        ),
        product_variants (
          id,
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
      .eq("categories.slug", categorySlug)
      .order(
        sort === "popularity" ? "popularity_score" :
        sort === "price_low" ? "price" :
        sort === "price_high" ? "price" :
        sort === "newest" ? "created_at" : "updated_at",
        {
          ascending: sort === "price_low" ? true : false
        }
      )
      .limit(limit);

    if (productError) return errorResponse(productError.message);

    if (!products || products.length === 0) {
      return errorResponse("No products found for this category", 404);
    }

    // Transform the response to make it cleaner
    const transformedProducts = products.map(product => ({
      ...product,
      category: product.categories // Rename for cleaner response
    }));

    // Remove the original categories field since we renamed it
    transformedProducts.forEach(product => delete product.categories);

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      category: products[0].category, // Include category info
      total: products.length
    });

  } catch (error) {
    console.error("Products by category fetch error:", error);
    return errorResponse(error.message);
  }
}

// Alternative approach using explicit join syntax (if the above doesn't work)
export async function GET_ALTERNATIVE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sort = searchParams.get("sort") || "popularity";

    if (!categorySlug) return errorResponse("Missing category slug", 400);

    // Using RPC function approach for complex joins (requires creating a function in Supabase)
    const { data: products, error: productError } = await supabase
      .rpc('get_products_by_category_slug', {
        category_slug: categorySlug,
        limit_count: limit,
        sort_by: sort
      });

    if (productError) return errorResponse(productError.message);

    if (!products || products.length === 0) {
      return errorResponse("No products found for this category", 404);
    }

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });

  } catch (error) {
    console.error("Products by category fetch error:", error);
    return errorResponse(error.message);
  }
}
