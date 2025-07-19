'use client';
import { useEffect, useState } from 'react';

export default function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show the rabbit logo loader instead of generic spinner
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img
            src='/assets/loader.gif'
            alt='Loading...'
            className='h-48 w-48 mx-auto mb-4'
          />
        </div>
      </div>
    );
  }

  return children;
}
