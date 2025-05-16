'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/UserNavbar';
import '../../app/globals.css';

export default function UserDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error);
      else setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile Summary</h2>
          <p className="mb-1">Email: {user?.email}</p>
          <p className="mb-1">Role: User</p>
          <p>Status: Active</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Order History</h2>
          <p className="text-gray-500">You havent placed any orders yet.</p>
        </div>
      </main>
    </div>
  );
}
