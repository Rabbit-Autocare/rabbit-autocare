'use client';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import "../app/globals.css"
export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getSession();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback', // adjust for production
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
      }}
    >
      <div className="bg-white bg-opacity-90 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🚘 Welcome to My App</h1>

        {user ? (
          <>
            <p className="mb-4 text-gray-700">Logged in as <strong>{user.email}</strong></p>
            <button
              onClick={() => router.push('/user')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mb-3 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold py-2 rounded transition"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
          >
            Login with Google
          </button>
        )}
      </div>
    </div>
  );
}
