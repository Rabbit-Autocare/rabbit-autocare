'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSessionPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setSession(session);
    } catch (err) {
      console.error("Error fetching session:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Session Test Page</h1>

      {loading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
          <p>Loading session...</p>
        </div>
      )}

      {error && (
        <div className="text-red-600">
          <p>Error: {error}</p>
          <p>Please ensure you are logged in.</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Session Data:</h2>
          {session ? (
            <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
              <pre className="text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(session, null, 2)}
              </pre>
              <h3 className="text-lg font-semibold mt-4">Access Token:</h3>
              <p className="text-sm break-all">{session.access_token}</p>
              <h3 className="text-lg font-semibold mt-4">User ID:</h3>
              <p className="text-sm break-all">{session.user.id}</p>
            </div>
          ) : (
            <p className="text-gray-600">No active session found. Please log in.</p>
          )}
        </div>
      )}
    </div>
  );
}
