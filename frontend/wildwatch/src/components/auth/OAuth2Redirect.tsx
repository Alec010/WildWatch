'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { handleAuthRedirect } from '@/utils/auth';

export default function OAuth2Redirect() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const processLogin = async () => {
            try {
                // Get the encoded data from URL parameters
                if (typeof window !== 'undefined') {
                  const urlParams = new URLSearchParams(window.location.search);
                  const encodedData = urlParams.get('data');
                
                  if (!encodedData) {
                      throw new Error('No data received from OAuth provider');
                  }

                  // Decode and parse the data
                  const data = JSON.parse(decodeURIComponent(encodedData));
                  console.log('OAuth response data:', data);

                  // Store the token using token service (handles automatic refresh)
                  const tokenService = (await import('@/utils/tokenService')).default;
                  tokenService.setToken(data.token);

                  // Check if we have a valid user object
                  if (!data.user || !data.user.email) {
                      throw new Error('Invalid user data received');
                  }

                  // Check if terms are accepted
                  if (!data.user.termsAccepted) {
                      console.log('Terms not accepted, redirecting to terms page');
                      // Store the user data in session storage to be used after terms acceptance
                      sessionStorage.setItem('oauthUserData', JSON.stringify(data.user));
                      router.push('/terms');
                      return;
                  }

                  // Check if contact number and password are set
                  if (data.user.authProvider === 'microsoft' && 
                      (data.user.contactNumber === 'Not provided' || !data.user.password)) {
                      console.log('Contact number or password not set, redirecting to setup page');
                      sessionStorage.setItem('oauthUserData', JSON.stringify(data.user));
                      router.push('/auth/setup');
                      return;
                  }

                  console.log('All requirements met, redirecting to dashboard');
                  // Use handleAuthRedirect to determine the correct redirect path
                  const redirectPath = handleAuthRedirect(data.user);
                  router.push(redirectPath);
                } else {
                  // If window is not available, redirect to login
                  router.push('/login');
                }
            } catch (err) {
                console.error('Error during OAuth redirect:', err);
                setError('Failed to process login. Please try again.');
                // Redirect to login page with error message
                router.push('/login?error=' + encodeURIComponent(err instanceof Error ? err.message : 'Failed to process login'));
            } finally {
                setIsLoading(false);
            }
        };

        processLogin();
    }, [router]);

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-500 mb-4">{error}</div>
                    <button 
                        onClick={() => router.push('/login')}
                        className="text-blue-500 hover:underline"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your login...</p>
            </div>
        </div>
    );
} 