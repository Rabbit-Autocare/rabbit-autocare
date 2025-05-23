'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function saveUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.error('❌ Auth error:', error)
        router.push('/login')
        return
      }

      const email = user.email
      let username = email.split('@')[0].replace(/[^a-zA-Z]/g, '')
      if (!username || username.length < 3) {
        username = 'user' + Math.floor(Math.random() * 9000 + 1000)
      }

      // Upsert user into your users table
      const { error: dbError } = await supabase.from('users').upsert({
        id: user.id,
        email,
        name: username,
      })

      if (dbError) {
        console.error('❌ DB Error:', dbError)
        router.push('/login')
        return
      }

      // Check if user is admin (adjust your admin table/schema)
      const { data: adminMatch, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ Admin check error:', adminError)
        router.push('/login')
        return
      }

      if (adminMatch) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }

    saveUser()
  }, [router])

  return <p>Signing you in...</p>
}
