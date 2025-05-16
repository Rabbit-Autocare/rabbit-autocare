'use client';

import "../../app/globals.css";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
  };

  const toggleBanStatus = async (user) => {
    const newStatus = !user.is_banned;
    await supabase
      .from('users')
      .update({ is_banned: newStatus })
      .eq('id', user.id);

    fetchUsers(); // Refresh data
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Users <span className="text-gray-500 text-lg">({users.length})</span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white shadow-md rounded-lg p-5 border hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{user.name || 'Unnamed'}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    user.is_banned
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {user.is_banned ? 'Banned' : 'Active'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Email:</strong> {user.email}
              </p>

              <button
                onClick={() => toggleBanStatus(user)}
                className={`px-4 py-2 text-sm rounded transition font-medium ${
                  user.is_banned
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {user.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
