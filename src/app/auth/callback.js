'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const saveUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('❌ Auth error:', error);
        return;
      }

      const email = user.email;
      let username = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
      if (!username || username.length < 3) {
        username = 'user' + Math.floor(Math.random() * 9000 + 1000);
      }

      // Save user into the users table
      const { error: dbError } = await supabase.from('users').upsert({
        id: user.id,
        email: email,
        name: username,
      });

      if (dbError) {
        console.error('❌ DB Error:', dbError);
        return;
      }

      console.log('✅ User saved:', { email, name: username });

      // 🔍 Check if user is an admin
      const { data: adminMatch, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ Admin check error:', adminError);
        return;
      }

      // ✅ Redirect based on admin status
      if (adminMatch) {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    };

    saveUser();
  }, []);

  return <p>Signing you in...</p>;
}
