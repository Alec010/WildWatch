'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { handleAuthRedirect } from '@/utils/auth';

export default function OAuth2Redirect() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processLogin = async () => {
            try {
                // Get the encoded data from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const encodedData = urlParams.get('data');
                
                if (!encodedData) {
                    throw new Error('No data received from OAuth provider');
                }

                // Decode and parse the data
                const data = JSON.parse(decodeURIComponent(encodedData));
                console.log('OAuth response data:', data);

                // Store the token in a cookie
                Cookies.set('token', data.token, { 
                    expires: 7,
                    secure: true,
                    sameSite: 'strict'
                });

                // Check if we have a valid user object
                if (!data.user || !data.user.email) {
                    throw new Error('Invalid user data received');
                }

                // Use handleAuthRedirect to determine the correct redirect path
                const redirectPath = handleAuthRedirect(data.user);
                router.push(redirectPath);
            } catch (err) {
                console.error('Error during OAuth redirect:', err);
                setError('Failed to process login. Please try again.');
                router.push('/auth/login');
            }
        };

        processLogin();
    }, [router]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
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