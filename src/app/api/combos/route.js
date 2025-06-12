import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (combos): ${message}`);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get a specific combo with its related products
      const { data: combo, error: comboError } = await supabase
        .from('combos')
        .select('*')
        .eq('id', id)
        .single();

      if (comboError) return errorResponse(comboError.message);

      const { data: comboProducts, error: productsError } = await supabase
        .from('combo_products')
        .select(
          `
		  product_id,
		  variant_id,
		  quantity,
		  products:products(*)
		`
        )
        .eq('combo_id', id);

      if (productsError) return errorResponse(productsError.message);

      return NextResponse.json({
        combo,
        products: comboProducts,
      });
    }

    // Get all combos
    const { data: combos, error } = await supabase
      .from('combos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return errorResponse(error.message);

    return NextResponse.json({ combos });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const {
      name,
      description,
      image_url,
      original_price,
      price,
      discount_percent,
      products,
    } = await request.json();

    if (!name) return errorResponse('Name is required', 400);
    if (!Array.isArray(products) || products.length === 0)
      return errorResponse('At least one product must be selected', 400);

    // Begin transaction with combo creation
    const { data: combo, error: comboError } = await supabase
      .from('combos')
      .insert([
        {
          name,
          description,
          image_url,
          original_price: parseFloat(original_price) || 0,
          price: parseFloat(price) || 0,
          discount_percent: parseFloat(discount_percent) || 0,
        },
      ])
      .select()
      .single();

    if (comboError) return errorResponse(comboError.message);

    // Add products to the combo
    const comboProductEntries = products.map((product) => ({
      combo_id: combo.id,
      product_id: product.product_id,
      variant_id: product.variant_id,
      quantity: product.quantity || 1,
    }));

    const { error: productError } = await supabase
      .from('combo_products')
      .insert(comboProductEntries);

    if (productError) return errorResponse(productError.message);

    return NextResponse.json({ success: true, combo });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('ID is required', 400);

    const { error } = await supabase.from('combos').delete().eq('id', id);

    if (error) return errorResponse(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error.message);
  }
}
