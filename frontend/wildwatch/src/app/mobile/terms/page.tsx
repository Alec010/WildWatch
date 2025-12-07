"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { handleAuthRedirect } from "@/utils/auth";
import Cookies from "js-cookie";
import { getApiBaseUrl } from "@/utils/api";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Shield,
  UserCheck,
  Lock,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

export default function MobileTermsPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const mobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) || window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile) {
          // Redirect to desktop terms page if not mobile
          router.replace("/terms");
        }
      }
    };
    checkMobile();

    // Check if this is an OAuth user
    const oauthUserData = sessionStorage.getItem("oauthUserData");
    setIsOAuthUser(!!oauthUserData);
  }, [router]);

  const handleAcceptTerms = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Sending terms acceptance request...");

      // ✅ FIX: Get token from multiple sources for Android compatibility
      // Android browsers may not send cookies with sameSite: 'strict' after OAuth redirect
      let token: string | undefined = Cookies.get("token");

      // Fallback 1: Check URL params (OAuth redirect may include token)
      if (!token && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get("token") || undefined;
        // If found in URL, also set it in cookies for future requests
        if (token) {
          Cookies.set("token", token, {
            expires: 7,
            secure: true,
            sameSite: "lax",
            path: "/",
          });
        }
      }

      // Fallback 2: Check sessionStorage (OAuth2Redirect may have stored it)
      if (!token && typeof window !== "undefined") {
        const oauthUserData = sessionStorage.getItem("oauthUserData");
        if (oauthUserData) {
          try {
            const userData = JSON.parse(oauthUserData);
            // Token might be in the OAuth user data
            const tokenFromStorage = userData.token;
            if (tokenFromStorage && typeof tokenFromStorage === "string") {
              token = tokenFromStorage;
              Cookies.set("token", tokenFromStorage, {
                expires: 7,
                secure: true,
                sameSite: "lax",
                path: "/",
              });
            }
          } catch (e) {
            console.warn("Could not parse oauthUserData:", e);
          }
        }
      }

      if (!token) {
        throw new Error(
          "No authentication token found. Please try logging in again."
        );
      }

      const response = await fetch(`${getApiBaseUrl()}/api/terms/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        mode: "cors",
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to accept terms: ${errorText}`);
      }

      const responseText = await response.text();
      console.log("Success response:", responseText);

      // If this is an OAuth user, always redirect to mobile setup after accepting terms
      if (isOAuthUser) {
        const oauthUserData = JSON.parse(
          sessionStorage.getItem("oauthUserData") || "{}"
        );
        oauthUserData.termsAccepted = true;
        sessionStorage.setItem("oauthUserData", JSON.stringify(oauthUserData));
        console.log("Redirecting to: /mobile/setup");
        router.push("/mobile/setup");
        return;
      }

      // For regular users, fetch the user profile to get the role
      const profileResponse = await fetch(
        `${getApiBaseUrl()}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await profileResponse.json();
      const redirectPath = handleAuthRedirect(userData);
      console.log("Redirecting to:", redirectPath);
      router.push(redirectPath);
    } catch (error) {
      console.error("Error accepting terms:", error);
      setError(
        error instanceof Error ? error.message : "Failed to accept terms"
      );

      // If the error is due to authentication, redirect to login
      if (error instanceof Error && error.message.includes("401")) {
        console.log("Authentication failed, redirect to login...");
        router.push("/login");
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const sections = [
    {
      title: "Use of the Platform",
      icon: <Shield className="h-6 w-6 text-[#800000]" />,
      content: (
        <>
          <p className="mb-4 mt-3 text-foreground">
            WildWatch is intended to facilitate the structured reporting,
            tracking, and resolution of campus-related incidents within CITU.
            Use of this platform must be in accordance with university policies,
            applicable laws, and ethical conduct.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              You must be a currently enrolled student or an authorized CITU
              personnel to use the platform.
            </li>
            <li>
              You agree to provide accurate, truthful, and complete information
              when submitting a report or using any part of the Platform.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "User Responsibilities",
      icon: <UserCheck className="h-6 w-6 text-[#800000]" />,
      content: (
        <>
          <p className="mb-4 mt-3 text-foreground">
            As a user of WildWatch, you agree:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Not to impersonate others or use false identities.</li>
            <li>
              Not to upload, share, or distribute content that is harmful,
              obscene, threatening, discriminatory, or violates the rights of
              others.
            </li>
            <li>
              To respect the gamification system and not exploit it for personal
              gain or manipulation.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Privacy and Data Protection",
      icon: <Lock className="h-6 w-6 text-[#800000]" />,
      content: (
        <ul className="list-disc pl-6 mb-4 mt-3 space-y-2">
          <li>
            Your personal information will be handled in accordance with our
            Privacy Policy
          </li>
          <li>
            Incident reports and related information will be treated with
            appropriate confidentiality
          </li>
          <li>
            Access to incident details will be restricted to authorized
            personnel only
          </li>
        </ul>
      ),
    },
    {
      title: "Platform Rules",
      icon: <AlertTriangle className="h-6 w-6 text-[#800000]" />,
      content: (
        <>
          <p className="mb-2 text-foreground font-medium">Users must NOT:</p>
          <ul className="list-disc pl-6 mb-4 mt-3 space-y-2">
            <li>Submit false or malicious reports</li>
            <li>Harass or intimidate other users</li>
            <li>Share confidential information about incidents publicly</li>
            <li>Attempt to compromise the platform's security</li>
            <li>Use the platform for any illegal activities</li>
          </ul>
        </>
      ),
    },
    {
      title: "Limitation of Liability",
      icon: <AlertCircle className="h-6 w-6 text-[#800000]" />,
      content: (
        <ul className="list-disc pl-6 mb-4 mt-3 space-y-2">
          <li>
            CITU and the WildWatch team are not responsible for delays in action
            due to incomplete, false, or unverifiable reports.
          </li>
          <li>
            The platform is provided on an "as-is" basis. While we strive for
            accuracy and promptness, we do not guarantee uninterrupted or
            error-free operations.
          </li>
        </ul>
      ),
    },
    {
      title: "Amendments",
      icon: <RefreshCw className="h-6 w-6 text-[#800000]" />,
      content: (
        <p className="mb-4 mt-3 text-foreground">
          These Terms may be updated at any time. Continued use of the Platform
          after changes are posted constitutes acceptance of the revised Terms.
        </p>
      ),
    },
    {
      title: "Contact Us",
      icon: <HelpCircle className="h-6 w-6 text-[#800000]" />,
      content: (
        <p className="mb-4 mt-3 text-foreground">
          For questions or concerns regarding these Terms or your use of the
          Platform, you may contact the WildWatch Support Team via the official
          CITU Office of Student Affairs.
        </p>
      ),
    },
  ];

  if (!isMobile) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col overflow-y-auto">
      {/* Header with gradient border */}
      <div className="bg-white shadow-sm relative flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] animate-gradient-x"></div>
        <div className="max-w-[1200px] mx-auto p-4 pt-6">
          <Image
            src="/logo2.png"
            alt="WildWatch Logo"
            width={150}
            height={50}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-[#D4AF37]/20 relative">
            {/* Decorative elements */}
            <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

            {/* Header section */}
            <div className="p-8 border-b border-[#D4AF37]/30 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-1 bg-[#800000] rounded-full"></div>
                <h1 className="text-3xl font-bold text-[#800000]">
                  Terms and Conditions
                </h1>
              </div>
              <p className="text-muted-foreground ml-6">
                Effective Date: April 08, 2025
              </p>

              <div className="mt-6 p-5 bg-[#FFF8E1] border-l-4 border-[#D4AF37] rounded-md">
                <p className="text-foreground leading-relaxed">
                  Welcome to WildWatch, the official incident reporting and case
                  management platform of Cebu Institute of Technology –
                  University (CITU). By accessing or using the WildWatch website
                  and application (the "Platform"), you agree to comply with and
                  be bound by the following Terms and Conditions. Please read
                  them carefully.
                </p>
              </div>
            </div>

            {/* Accordion sections */}
            <div className="p-6 md:p-8 space-y-4">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`border rounded-lg transition-all duration-200 ${
                    activeSection === index
                      ? "border-[#D4AF37]/40 bg-[#FFF8E1]/30 shadow-md"
                      : "border-[#D4AF37]/20 hover:border-[#D4AF37]/30 hover:bg-[#FFF8E1]/10"
                  }`}
                >
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          activeSection === index
                            ? "bg-[#800000]/10"
                            : "bg-[#D4AF37]/10"
                        }`}
                      >
                        {section.icon}
                      </div>
                      <span
                        className={`text-lg ${
                          activeSection === index
                            ? "text-[#800000] font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        {index + 1}. {section.title}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-[#800000]/70 transition-transform duration-200 ${
                        activeSection === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      activeSection === index
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-4 pt-0 border-t border-[#D4AF37]/20">
                      {section.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mx-8 mb-6 p-4 bg-red-50 border-l-4 border-[#800000] rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-[#800000] mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-normal text-red-600">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="p-8 border-t border-[#D4AF37]/30 bg-[#FFF8E1]/20">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground max-w-md">
                  By clicking "Accept Terms", you acknowledge that you have read
                  and agree to be bound by these Terms and Conditions.
                </p>
                <Button
                  onClick={handleAcceptTerms}
                  className="bg-[#800000] hover:bg-[#800000]/90 text-white font-medium py-6 px-8 transition-all duration-300 shadow-md hover:shadow-lg min-w-[180px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Accepting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Accept Terms
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-4 border-t border-[#D4AF37]/20 mt-auto flex-shrink-0">
        <div className="max-w-[1200px] mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WildWatch - Cebu Institute of
          Technology – University. All rights reserved.
        </div>
      </div>
    </div>
  );
}
