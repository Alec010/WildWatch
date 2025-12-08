"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/utils/api";
import { clearAllStorage } from "@/utils/storageCleanup";
import tokenService from "@/utils/tokenService";
import Cookies from "js-cookie";
import Image from "next/image";
import { Smartphone, ExternalLink, CheckCircle2 } from "lucide-react";

export default function OAuthRedirectPage() {
  const router = useRouter();
  const [isOpeningApp, setIsOpeningApp] = useState(false);
  const [appOpened, setAppOpened] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    if (typeof window !== "undefined") {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 1024;

      if (!isMobile) {
        // Redirect to desktop if not on mobile
        router.replace("/auth/setup");
      }
    }
  }, [router]);

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Step 1: Attempt to call backend logout endpoint
      try {
        const token =
          Cookies.get("token") ||
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];

        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok && response.status !== 404) {
            console.warn(
              "Logout API call failed, but continuing with local logout"
            );
          }
        }
      } catch (apiError) {
        console.warn(
          "Logout API error (continuing with local logout):",
          apiError
        );
      }

      // Step 2: Clear all storage
      clearAllStorage();

      // Step 3: Remove token via tokenService
      tokenService.removeToken();

      // Step 4: Clear cookies explicitly
      Cookies.remove("token", { path: "/" });
      Cookies.remove("token", {
        path: "/",
        domain: window.location.hostname,
      });
      Cookies.remove("token", {
        path: "/",
        domain: `.${window.location.hostname}`,
      });

      // Step 5: Small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("Logout completed successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to clear storage
      try {
        clearAllStorage();
        tokenService.removeToken();
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenApp = async () => {
    try {
      setIsOpeningApp(true);

      // Get token from cookies or URL params
      let token: string | undefined = Cookies.get("token");

      if (!token && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get("token") || undefined;
      }

      // Deep link to open the mobile app with token
      const appScheme = token
        ? `wildwatchexpo://auth/oauth2/callback?token=${encodeURIComponent(
            token
          )}`
        : "wildwatchexpo://auth/oauth2/callback";
      const fallbackUrl =
        "https://play.google.com/store/apps/details?id=com.wildwatch.app";

      // Track if page loses focus (indicates app might have opened)
      let pageLostFocus = false;
      const blurHandler = () => {
        pageLostFocus = true;
      };
      window.addEventListener("blur", blurHandler);

      // Try to open the app
      window.location.href = appScheme;

      // Wait to see if app opened (user navigated away)
      setTimeout(() => {
        window.removeEventListener("blur", blurHandler);

        // Check if page lost focus (app likely opened) or if still focused
        if (pageLostFocus || !document.hasFocus()) {
          // App likely opened successfully
          setAppOpened(true);
          // Perform logout after a short delay to ensure app has time to receive the token
          setTimeout(() => {
            performLogout();
          }, 1000);
        } else {
          // App didn't open, redirect to app store
          setIsOpeningApp(false);
          window.location.href = fallbackUrl;
        }
      }, 2000);
    } catch (error) {
      console.error("Error opening app:", error);
      setIsOpeningApp(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-y-auto py-10"
      style={{ backgroundColor: "#f5f5f7" }}
    >
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20 mx-4">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
        <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="relative bg-white rounded-full p-1">
              <Image
                src="/logo.png"
                alt="WildWatch Logo"
                width={150}
                height={50}
                priority
                className="relative"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#800000] text-center">
            Open WildWatch App
          </h1>
        </div>

        <div className="p-6 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] border border-[#D4AF37]/40 rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#800000]/10 rounded-full p-2 mt-1">
              <Smartphone className="h-6 w-6 text-[#800000]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#800000] mb-2">
                Continue in App
              </h3>
              <p className="text-sm text-gray-700">
                Your account setup is complete! Click the button below to open
                the WildWatch mobile app and continue your experience.
              </p>
            </div>
          </div>

          {appOpened && !isLoggingOut && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                App opened successfully! Logging out...
              </p>
            </div>
          )}

          {isLoggingOut && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <p className="text-sm text-blue-700">Cleaning up session...</p>
            </div>
          )}

          <Button
            onClick={handleOpenApp}
            disabled={isOpeningApp || appOpened || isLoggingOut}
            className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white font-medium py-6 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpeningApp ? (
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
                Opening App...
              </span>
            ) : appOpened ? (
              <span className="flex items-center justify-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                App Opened
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <ExternalLink className="mr-2 h-5 w-5" />
                Open App
              </span>
            )}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>
            Don't have the app?{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.wildwatch.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors"
            >
              Download from Play Store
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
