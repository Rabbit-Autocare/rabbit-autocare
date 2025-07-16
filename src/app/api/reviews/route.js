import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export async function GET(req) {
  const supabase = createSupabaseBrowserClient();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  const product_id = searchParams.get('product_id');
  const order_id = searchParams.get('order_id');

  let query = supabase.from('reviews').select('*, product:products(*), order:orders(*)');
  if (user_id) query = query.eq('user_id', user_id);
  if (product_id) query = query.eq('product_id', product_id);
  if (order_id) query = query.eq('order_id', order_id);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const supabase = createSupabaseBrowserClient();
  const body = await req.json();
  const { user_id, order_id, product_id, rating, review_text } = body;

  if (!user_id || !order_id || !product_id || !rating) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase.from('reviews').insert([
    { user_id, order_id, product_id, rating, review_text }
  ]).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
