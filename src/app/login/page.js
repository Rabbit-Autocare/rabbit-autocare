'use client'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { user, userData, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">User Profile</h1>

          <div className="space-y-4 text-left">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-semibold">{userData?.name || 'Not set'}</p>
            </div>

            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-semibold">{user.email}</p>
            </div>

            <div>
              <p className="text-gray-600">User Type:</p>
              <p className="font-semibold">
                {userData?.is_admin ? 'Admin' : 'Regular User'}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Account Status:</p>
              <p className={`font-semibold ${userData?.is_banned ? 'text-red-600' : 'text-green-600'}`}>
                {userData?.is_banned ? 'Banned' : 'Active'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {userData?.is_admin ? (
              <button
                onClick={() => router.push('/admin')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
              >
                Go to Admin Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
            )}

            <button
              onClick={signOut}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6">
      <h1 className="text-2xl font-bold">Login with Google</h1>
      <button
        onClick={signInWithGoogle}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition"
      >
        Sign in with Google
      </button>
    </div>
  )
}
