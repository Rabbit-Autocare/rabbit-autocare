'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const processLogin = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('❌ Auth error:', error);
        return;
      }

      const email = user.email;

      // 🛡️ Step 1: Check if user is an admin
      const { data: adminMatch, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();

      if (adminMatch) {
        console.log('✅ Admin detected:', email);
        router.push('/admin'); // Redirect to admin dashboard
        return; // ⛔ Don't save in users table
      }

      // 👤 Step 2: It's a normal user — create username
      let username = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
      if (!username || username.length < 3) {
        username = 'user' + Math.floor(Math.random() * 9000 + 1000);
      }

      // 🗃️ Step 3: Save normal user in users table
      const { error: dbError } = await supabase.from('users').upsert({
        id: user.id,
        email: email,
        name: username,
      });

      if (dbError) {
        console.error('❌ Failed to save user:', dbError);
        return;
      }

      console.log('✅ User saved:', { email, name: username });
      router.push('/user'); // Redirect to user dashboard
    };

    processLogin();
  }, []);

  return <p>Signing you in...</p>;
}
