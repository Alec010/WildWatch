"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { handleAuthRedirect } from "@/utils/auth";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

export default function TermsPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  useEffect(() => {
    // Check if this is an OAuth user
    const oauthUserData = sessionStorage.getItem('oauthUserData');
    setIsOAuthUser(!!oauthUserData);
  }, []);

  const handleAcceptTerms = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Sending terms acceptance request...');
      
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/terms/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        mode: 'cors'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to accept terms: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Success response:', responseText);

      // If this is an OAuth user, always redirect to setup after accepting terms
      if (isOAuthUser) {
        const oauthUserData = JSON.parse(sessionStorage.getItem('oauthUserData') || '{}');
        oauthUserData.termsAccepted = true;
        sessionStorage.setItem('oauthUserData', JSON.stringify(oauthUserData));
        console.log('Redirecting to: /auth/setup');
        router.push('/auth/setup');
        return;
      }

      // For regular users, fetch the user profile to get the role
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await profileResponse.json();
      const redirectPath = handleAuthRedirect(userData);
      console.log('Redirecting to:', redirectPath);
      router.push(redirectPath);
    } catch (error) {
      console.error('Error accepting terms:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to accept terms'
      );
      
      // If the error is due to authentication, redirect to login
      if (error instanceof Error && error.message.includes('401')) {
        console.log('Authentication failed, redirect to login...');
        router.push('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[1200px] mx-auto p-4">
          <Image
            src="/logo.png"
            alt="WildWatch Logo"
            width={150}
            height={50}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-[#8B0000] mb-4">Terms and Conditions</h1>
              <p className="text-gray-600 mb-6">Effective Date: April 08, 2025</p>

              <div className="prose max-w-none mb-8">
                <p className="mb-4">
                  Welcome to WildWatch, the official incident reporting and case management platform of Cebu Institute of Technology – University (CITU). By accessing or using the WildWatch website and application (the "Platform"), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.
                </p>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Use of the Platform</h2>
                <p className="mb-4">
                  WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU. Use of this platform must be in accordance with university policies, applicable laws, and ethical conduct.
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>You must be a currently enrolled student or an authorized CITU personnel to use the platform.</li>
                  <li>You agree to provide accurate, truthful, and complete information when submitting a report or using any part of the Platform.</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. User Responsibilities</h2>
                <p className="mb-4">As a user of WildWatch, you agree:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Not to impersonate others or use false identities.</li>
                  <li>Not to upload, share, or distribute content that is harmful, obscene, threatening, discriminatory, or violates the rights of others.</li>
                  <li>To respect the gamification system and not exploit it for personal gain or manipulation.</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. Privacy and Data Protection</h2>
                <ul className="list-disc pl-6 mb-4">
                  <li>Your personal information will be handled in accordance with our Privacy Policy</li>
                  <li>Incident reports and related information will be treated with appropriate confidentiality</li>
                  <li>Access to incident details will be restricted to authorized personnel only</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Platform Rules</h2>
                <p>Users must NOT:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Submit false or malicious reports</li>
                  <li>Harass or intimidate other users</li>
                  <li>Share confidential information about incidents publicly</li>
                  <li>Attempt to compromise the platform's security</li>
                  <li>Use the platform for any illegal activities</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Limitation of Liability</h2>
                <ul className="list-disc pl-6 mb-4">
                  <li>CITU and the WildWatch team are not responsible for delays in action due to incomplete, false, or unverifiable reports.</li>
                  <li>The platform is provided on an "as-is" basis. While we strive for accuracy and promptness, we do not guarantee uninterrupted or error-free operations.</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6. Amendments</h2>
                <p className="mb-4">
                  These Terms may be updated at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.
                </p>

                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7. Contact Us</h2>
                <p className="mb-4">
                  For questions or concerns regarding these Terms or your use of the Platform, you may contact the WildWatch Support Team via the official CITU Office of Student Affairs.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleAcceptTerms}
                  className="bg-[#8B0000] hover:bg-[#6B0000] text-white px-8 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accepting Terms...' : 'Accept Terms'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 