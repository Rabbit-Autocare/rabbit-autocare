// app/login/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const checkUser = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        setUser(session.user);

        // Fetch user data from auth_users table
        const { data: userInfo, error: userError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        setUserData(userInfo);

        // Console log user details with highlighted fields
        console.log('User Details:', {
          Email: userInfo.email,
          'Admin Status': userInfo.is_admin ? 'Admin User' : 'Regular User',
          'Full User Data': userInfo,
        });

        // Redirect based on user role
        if (userInfo.is_admin) {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      }
    } catch (error) {
      const errorMsg = error?.message || JSON.stringify(error) || String(error);
      console.error('Error checking user:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('[LoginPage] Starting Google OAuth sign in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserData(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Loading...</h1>
        </div>
      </div>
    );
  }

  // If user is logged in, they should be redirected automatically
  // This section will only show briefly before redirect or if there's an error
  if (user && userData) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Redirecting...</h1>
          <p className='text-gray-600'>
            Redirecting to {userData.is_admin ? 'admin' : 'user'} dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show login form only if user is not logged in
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white p-8 rounded-lg shadow-md'>
          <h2 className='text-2xl font-bold text-center mb-6'>
            Sign in to your account
          </h2>
          <button
            onClick={handleGoogleSignIn}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}




// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
// import { Google } from 'lucide-react';

// export default function LoginPage() {
//   const router = useRouter();
//   const [user, setUser] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const supabase = createSupabaseBrowserClient();

//   const checkUser = useCallback(async () => {
//     try {
//       const {
//         data: { session },
//         error,
//       } = await supabase.auth.getSession();

//       if (error) throw error;

//       if (session?.user) {
//         setUser(session.user);

//         const { data: userInfo, error: userError } = await supabase
//           .from('auth_users')
//           .select('*')
//           .eq('id', session.user.id)
//           .single();

//         if (userError) throw userError;

//         setUserData(userInfo);

//         console.log('User Details:', {
//           Email: userInfo.email,
//           'Admin Status': userInfo.is_admin ? 'Admin User' : 'Regular User',
//           'Full User Data': userInfo,
//         });

//         if (userInfo.is_admin) {
//           router.push('/admin');
//         } else {
//           router.push('/user');
//         }
//       }
//     } catch (error) {
//       const errorMsg = error?.message || JSON.stringify(error) || String(error);
//       console.error('Error checking user:', errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   }, [supabase, router]);

//   useEffect(() => {
//     checkUser();
//   }, [checkUser]);

//   const handleGoogleSignIn = async () => {
//     try {
//       console.log('[LoginPage] Starting Google OAuth sign in...');
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`,
//         },
//       });

//       if (error) throw error;
//     } catch (error) {
//       console.error('Error signing in:', error);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;

//       setUser(null);
//       setUserData(null);
//       router.push('/login');
//     } catch (error) {
//       console.error('Error logging out:', error);
//     }
//   };

//   if (loading) {
//     return (
//       <div className='flex justify-center items-center h-screen bg-gradient-to-tr from-indigo-100 to-purple-200'>
//         <div className='text-center'>
//           <h1 className='text-3xl font-extrabold mb-4 text-indigo-700'>Loading...</h1>
//         </div>
//       </div>
//     );
//   }

//   if (user && userData) {
//     return (
//       <div className='flex justify-center items-center h-screen bg-gradient-to-tr from-indigo-100 to-purple-200'>
//         <div className='text-center'>
//           <h1 className='text-3xl font-extrabold mb-4 text-indigo-700'>Redirecting...</h1>
//           <p className='text-gray-700'>
//             Redirecting to {userData.is_admin ? 'admin' : 'user'} dashboard...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className='min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8'>
//       <div className='max-w-md w-full space-y-8'>
//         <div className='bg-white p-10 rounded-xl shadow-2xl border border-indigo-200'>
//           <h2 className='text-3xl font-extrabold text-center mb-6 text-indigo-700'>
//             Sign in to your account
//           </h2>

//           <button
//             onClick={handleGoogleSignIn}
//             className='w-full flex items-center justify-center py-3 px-6 border border-gray-300 rounded-md shadow-md bg-white hover:bg-gray-50 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500'
//           >
//             <Google className='w-6 h-6 mr-3 text-red-500' />
//             <span className='text-gray-700 text-lg font-semibold'>
//               Sign in with Google
//             </span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
