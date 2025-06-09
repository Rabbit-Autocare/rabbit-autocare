import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (colors): ${message}`)
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('color', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function POST(request) {
  try {
    const { color, hex_code } = await request.json();

    // Validate hex code
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(hex_code)) {
      return errorResponse("Invalid hex code format", 400)
    }

    const { data, error } = await supabase
      .from('colors')
      .insert([{ color, hex_code }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating color:', error);
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function PUT(request) {
  try {
    const { id, color, hex_code } = await request.json();

    // Validate hex code if provided
    if (hex_code) {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(hex_code)) {
        return errorResponse("Invalid hex code format", 400)
      }
    }

    const { data, error } = await supabase
      .from('colors')
      .update({ color, hex_code })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating color:', error);
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse("Color ID is required", 400)
    }

    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting color:', error);
    return errorResponse(error.message || "An unexpected error occurred")
  }
}
