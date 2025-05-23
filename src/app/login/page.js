'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback', // Redirect here to handle user DB save
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6">
      <h1 className="text-2xl font-bold">Login with Google</h1>
      <button onClick={handleGoogleLogin} className="btn bg-red-500 hover:bg-red-600">
        Sign in with Google
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
