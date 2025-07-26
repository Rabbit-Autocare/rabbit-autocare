'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    checkSession();

    // Check for error parameters from redirect
    const errorParam = searchParams.get('error');
    const errorDetails = searchParams.get('details');
    const errorMessage = searchParams.get('message');

    if (errorParam) {
      let errorText = '';
      switch (errorParam) {
        case 'oauth_error':
          errorText = `Google OAuth authorization failed${errorDetails ? `: ${errorDetails}` : ''}. Please try again.`;
          break;
        case 'account_banned':
          errorText = 'Your account has been banned. Please contact support.';
          break;
        case 'database_error':
          errorText = 'Database error occurred. Please try again.';
          break;
        case 'callback_error':
          errorText = `Authentication callback failed${errorMessage ? `: ${errorMessage}` : ''}. Please try again.`;
          break;
        case 'config_error':
          errorText = 'OAuth configuration error. Please contact support.';
          break;
        case 'no_code':
          errorText = 'Authorization code not received. Please try again.';
          break;
        case 'token_exchange_failed':
          errorText = 'Failed to exchange authorization code. Please try again.';
          break;
        case 'no_access_token':
          errorText = 'Failed to obtain access token. Please try again.';
          break;
        case 'no_email':
          errorText = 'Email not provided by Google. Please ensure your Google account has an email address.';
          break;
        default:
          errorText = 'An error occurred during login. Please try again.';
      }
      setError(errorText);
    }
  }, [searchParams]);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        // Redirect based on user role
        if (data.user.is_admin) {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      } else if (response.status === 403) {
        setError('Your account has been banned. Please contact support.');
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      setLoading(true);
      setError('');
      // Clear any existing error parameters from URL
      const url = new URL(window.location);
      url.searchParams.delete('error');
      url.searchParams.delete('details');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url);

      // Redirect to our custom Google OAuth signin endpoint
      window.location.href = '/api/auth/google/signin';
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to initiate Google Sign-In');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <h1 className='text-2xl font-bold mb-4'>Loading...</h1>
          <p className='text-gray-600'>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show redirecting message
  if (user) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <h1 className='text-2xl font-bold mb-4'>Redirecting...</h1>
          <p className='text-gray-600'>
            Redirecting to {user.is_admin ? 'admin' : 'user'} dashboard...
          </p>
          <button
            onClick={handleLogout}
            className='mt-4 text-sm text-indigo-600 hover:text-indigo-800'
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white p-8 rounded-lg shadow-md'>
          <div className='text-center mb-6'>

            <Image
              src="/assets/RabbitLogo.png"
              alt="Rabbit AutoCare"
              width={100}
              height={48} className="mx-auto h-12 w-auto mb-4"
            />

{/* <Image
  src="/assets/RabbitLogo.png"
  alt="Rabbit AutoCare"
  width={48}
  height={48}
  className="mx-auto h-12 w-auto mb-4"
/> */}

            {/* <img
              src=""
              alt="Rabbit AutoCare"
              className="mx-auto h-12 w-auto mb-4"
            /> */}
            <h2 className='text-3xl font-bold text-gray-900'>Welcome</h2>
            <p className='mt-2 text-sm text-gray-600'>
              Sign in to your account
            </p>
          </div>

          {error && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md'>
              <div className='flex'>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Authentication Error
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='space-y-4'>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className='w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-xs text-gray-500'>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
