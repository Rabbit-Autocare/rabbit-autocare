// app/api/auth/google/route.js
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 });
    }

    // Decode the JWT token from Google
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const { email, name, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json({ error: 'Email not found in Google response' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    let user;

    if (existingUser) {
      // User exists, update last login or any other fields if needed
      const { data: updatedUser, error: updateError } = await supabase
        .from('auth_users')
        .update({
          updated_at: new Date().toISOString(),
          name: name || existingUser.name // Update name if provided
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('auth_users')
        .insert({
          email,
          name,
          is_admin: false,
          is_banned: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      user = newUser;
    }

    // Check if user is banned
    if (user.is_banned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    // Create a session token (you can use JWT or any other method)
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
        is_banned: user.is_banned
      }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
