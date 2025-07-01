'use client';

import React, { createContext, useContext } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const supabase = createSupabaseBrowserClient();

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
