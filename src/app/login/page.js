// app/login/page.jsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Login Error:', error.message);
  };

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const user = session.user;
      const { email, id } = user;

      // Step 1: Check if user is admin
      const { data: admin } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();

      if (admin) {
        router.push('/admin');
        return;
      }

      // Step 2: If not admin, check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (!existingUser) {
        // Step 3: Insert user
        await supabase.from('users').insert([
          {
            id: id,
            email: email,
            name: user.user_metadata?.name || '',
          },
        ]);
      }

      router.push('/dashboard');
    };

    checkUserAndRedirect();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded shadow"
      >
        Login with Google
      </button>
    </div>
  );
}
