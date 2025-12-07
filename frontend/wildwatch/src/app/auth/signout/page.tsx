"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Cookies from "js-cookie";
import { getApiBaseUrl } from "@/utils/api";
import { clearAllStorage } from "@/utils/storageCleanup";
import tokenService from "@/utils/tokenService";
import { LogOut, CheckCircle2, Loader2 } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Get token before clearing
        const token = Cookies.get("token");

        // ✅ STEP 1: Perform server-side logout (API call to clear server session)
        try {
          if (token) {
            await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            });
          }
        } catch (logoutError) {
          console.error("Logout API error (non-critical):", logoutError);
          // Continue even if logout API fails - we'll still clear local storage
        }

        // ✅ STEP 2: Comprehensive cleanup - clear all storage and cookies
        clearAllStorage();

        // Also clear token via tokenService (dispatches events)
        tokenService.removeToken();

        // ✅ STEP 3: Remove token cookie with ALL possible combinations of options
        // Cookies must be removed with the exact same options they were set with
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname;
          const cookieOptions: Array<{
            path: string;
            secure?: boolean;
            sameSite?: "lax" | "strict" | "none";
            domain?: string;
          }> = [
            { path: "/" },
            { path: "/", secure: true },
            { path: "/", sameSite: "lax" },
            { path: "/", secure: true, sameSite: "lax" },
            { path: "/", domain: hostname },
            { path: "/", domain: hostname, secure: true },
            { path: "/", domain: hostname, sameSite: "lax" },
            { path: "/", domain: hostname, secure: true, sameSite: "lax" },
            { path: "/", domain: `.${hostname}` },
            { path: "/", domain: `.${hostname}`, secure: true },
            { path: "/", domain: `.${hostname}`, sameSite: "lax" },
            { path: "/", domain: `.${hostname}`, secure: true, sameSite: "lax" },
          ];

          // Remove cookie with all option combinations
          cookieOptions.forEach((options) => {
            try {
              Cookies.remove("token", options);
            } catch (e) {
              // Ignore errors for individual attempts
            }
          });

          // ✅ STEP 4: Also use document.cookie directly as a fallback
          // This ensures removal even if js-cookie fails
          const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
          const paths = ["/", ""];
          const domains = [hostname, `.${hostname}`, ""];

          paths.forEach((path) => {
            domains.forEach((domain) => {
              const domainPart = domain ? `domain=${domain};` : "";
              const pathPart = path ? `path=${path};` : "";
              document.cookie = `token=;expires=${expireDate};${domainPart}${pathPart}`;
            });
          });

          // Clear sessionStorage and localStorage explicitly (redundant but ensures cleanup)
          sessionStorage.clear();
          localStorage.clear();
        }

        // Small delay to ensure cleanup completes
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Mark as complete
        setIsComplete(true);
        setIsLoggingOut(false);

        // Redirect to login after a brief delay
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } catch (error) {
        console.error("Error during logout:", error);
        setError("An error occurred during logout. You will be redirected to login.");
        setIsLoggingOut(false);

        // Even if there's an error, try to clear storage as fallback
        try {
          clearAllStorage();
          tokenService.removeToken();
        } catch (cleanupError) {
          console.error("Error during fallback cleanup:", cleanupError);
        }

        // Redirect to login after error
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20">
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

          {isLoggingOut && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-[#800000] animate-spin" />
                <h1 className="text-2xl font-bold text-[#800000] text-center">
                  Signing Out...
                </h1>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Clearing your session and redirecting to login...
                </p>
              </div>
            </>
          )}

          {isComplete && !error && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-[#800000] text-center">
                  Signed Out Successfully
                </h1>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Your session has been cleared. Redirecting to login...
                </p>
              </div>
            </>
          )}

          {error && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <LogOut className="h-12 w-12 text-[#800000]" />
                </div>
                <h1 className="text-2xl font-bold text-[#800000] text-center">
                  Sign Out
                </h1>
                <p className="text-sm text-red-600 text-center max-w-sm">
                  {error}
                </p>
              </div>
            </>
          )}

          {!isLoggingOut && !isComplete && (
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white"
            >
              Go to Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

