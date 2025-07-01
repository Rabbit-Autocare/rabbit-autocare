import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { productId, variant, comboId, kitId } = await request.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { error } = await supabase.from('wishlist_items').insert({
    user_id: user.id,
    product_id: productId,
    variant,
    combo_id: comboId,
    kit_id: kitId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}