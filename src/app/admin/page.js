import '@/app/globals.css'
import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import AdminLayout from '@/components/layouts/AdminLayout'
import AnalyticsTabs from './analytics/AnalyticsTabs'

/**
 * Fetch admin dashboard data with custom auth
 */
async function fetchAdminDashboardData(startDate, endDate) {
  // Your existing dashboard data fetching logic
  // This should work with your existing Supabase queries
  const supabase = createSupabaseServerClient()

  try {
    // Example queries - adjust based on your actual dashboard needs
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { data: users } = await supabase
      .from('auth_users')
      .select('id, created_at')

    // Add your other dashboard queries here
    return {
      orders: orders || [],
      users: users || [],
      // Add other data as needed
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return {
      orders: [],
      users: []
    }
  }
}

/**
 * Admin Dashboard Server Component
 * Uses custom authentication instead of old auth system
 */
export default async function AdminPage({ searchParams }) {
  const startDate =
    searchParams?.startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate =
    searchParams?.endDate || new Date().toISOString().split('T')[0]

  try {
    // Get auth token from cookies
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      redirect('/login')
    }

    // Verify the token
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET)

    // Get user data from database
    const supabase = createSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', decodedToken.userId)
      .single()

    if (error || !user) {
      redirect('/login?error=user_not_found')
    }

    // Check if user is banned
    if (user.is_banned) {
      redirect('/login?error=account_banned')
    }

    // Check if user is admin
    if (!user.is_admin) {
      redirect('/user') // Redirect non-admins to user page
    }

    // Fetch dashboard data
    const dashboardData = await fetchAdminDashboardData(startDate, endDate)

    const authData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
        picture: user.picture
      },
      success: true
    }

    return (
      <AdminLayout>
        <AnalyticsTabs
          initialData={dashboardData}
          userAuth={authData}
          defaultDateRange={{ startDate, endDate }}
        />
      </AdminLayout>
    )

  } catch (error) {
    console.error('Admin page auth error:', error)
    redirect('/login?error=auth_failed')
  }
}
