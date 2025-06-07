"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Footer from "@/components/navigation/Footer"
import MainNavbar from "@/components/navigation/MainNavbar"
import { ThemeProvider } from "@/contexts/ThemeContext"

export default function ClientLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkSession()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (event === "SIGNED_IN" && !pathname.includes("/auth/callback")) {
        router.refresh()
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, pathname])

  if (loading && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MainNavbar user={user} />
      <main>{children}</main>
      <Footer />
    </ThemeProvider>
  )
}
