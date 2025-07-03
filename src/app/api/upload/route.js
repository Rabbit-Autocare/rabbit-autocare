import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "products"; // Default to "products" if not specified

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filePath = `${type}/${filename}`; // Use the type in the path
    console.log('Uploading file to:', filePath, 'type:', file.type, 'size:', buffer.length);

    // Log the service role key and URL (first 8 chars only)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log('Service role key starts with:', serviceRoleKey?.slice(0, 8));
    console.log('Supabase URL:', supabaseUrl);
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Supabase service role key or URL not configured' }, { status: 500 });
    }

    // Create the service role client
    let supabase;
    try {
      supabase = createSupabaseServiceRoleClient();
    } catch (e) {
      console.error('Supabase service role client error:', e);
      return NextResponse.json({ error: 'Supabase service role client not configured' }, { status: 500 });
    }

    // Upload to Supabase Storage using the service role key
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error, 'Key starts with:', serviceRoleKey?.slice(0, 8));
      return NextResponse.json(
        { error: error.message || "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: publicData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      console.error('Failed to get public URL for uploaded file:', filePath);
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
    }

    console.log('Upload succeeded. Public URL:', publicUrl);
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error in upload API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
