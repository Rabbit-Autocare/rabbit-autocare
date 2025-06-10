import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request, { params }) {
  try {
    const id = params.id

    // Fetch the product from Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
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
      .eq('product_code', id)
      .single()

    console.log('Supabase product fetch result:', { product, error })

    if (error) {
      console.error('Error fetching product:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const transformedProduct = {
      ...product,
      variants: product.product_variants || []
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
