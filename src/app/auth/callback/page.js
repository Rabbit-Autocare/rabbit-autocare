'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

/**
 * Auth Callback Page
 * This page handles the OAuth callback from Google authentication
 * It processes the authentication response and creates/updates user data
 */
export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🔄 Starting auth callback process...')
    handleCallback()
  }, [])

  const waitForSession = async (maxRetries = 10) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`🔄 Attempting to get session (attempt ${i + 1}/${maxRetries})...`)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (session) {
          console.log('✅ Session found:', session.user.email)
          return session
        }

        if (error) {
          console.error(`❌ Session error (attempt ${i + 1}):`, error)
        } else {
          console.log(`ℹ️ No session found (attempt ${i + 1})`)
        }

        // Wait for 1.5 seconds before next retry
        await new Promise(resolve => setTimeout(resolve, 1500))
      } catch (err) {
        console.error(`❌ Unexpected error getting session (attempt ${i + 1}):`, err)
      }
    }
    return null
  }

  const handleCallback = async () => {
    try {
      // Wait for session with retries
      const session = await waitForSession()

      if (!session) {
        console.error('❌ No session found after retries')
        setError('No session found. Please try logging in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Get user data
      const { data: user, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('❌ User error:', userError)
        setError('Failed to get user data. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      console.log('✅ User authenticated:', user.user.email)

      // Generate username from email
      const email = user.user.email
      let username = email.split('@')[0].replace(/[^a-zA-Z]/g, '')
      if (!username || username.length < 3) {
        username = 'user' + Math.floor(Math.random() * 9000 + 1000)
      }

      // Upsert user into users table
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.user.id,
          email: email,
          name: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        console.error('❌ Error saving user data:', upsertError)
        setError('Failed to save user data. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      console.log('✅ User data saved successfully')

      // Check if user is admin
      const { data: adminMatch, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ Admin check error:', adminError)
        setError('Failed to check admin status. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Add a longer delay before redirect to ensure session is properly set
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Redirect based on user role
      if (adminMatch) {
        console.log('✅ User is admin, redirecting to admin dashboard')
        router.push('/admin')
      } else {
        console.log('✅ User is regular user, redirecting to dashboard')
        router.push('/dashboard')
      }

    } catch (error) {
      console.error('❌ Unexpected error in callback:', error)
      setError('An unexpected error occurred. Please try again.')
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-700">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}
