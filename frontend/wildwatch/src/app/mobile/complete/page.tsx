"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Smartphone, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function MobileCompletePage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);

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
          // Redirect to dashboard if not mobile
          router.replace("/dashboard");
        }
      }
    };
    checkMobile();

    // ✅ FIX: Get token from multiple sources for Android compatibility
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get("token") || Cookies.get("token") || null;

      // Fallback: Check sessionStorage for OAuth user data
      if (!token) {
        const oauthUserData = sessionStorage.getItem("oauthUserData");
        if (oauthUserData) {
          try {
            const userData = JSON.parse(oauthUserData);
            if (userData.token) {
              token = userData.token;
            }
          } catch (e) {
            console.warn("Could not parse oauthUserData:", e);
          }
        }
      }

      // If token found in URL, store it in cookies for consistency
      if (token && urlParams.get("token")) {
        Cookies.set("token", token, {
          expires: 7,
          secure: true,
          sameSite: "lax",
          path: "/",
        });
      }

      setAuthToken(token);
    }

    // Show success message first, then dialog after 2 seconds
    const timer = setTimeout(() => {
      setShowSuccessMessage(false);
      setShowSuccessDialog(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleOpenApp = async () => {
    try {
      // Use stored token or get from cookies as fallback
      const token = authToken || Cookies.get("token");

      // ✅ STEP 1: Perform web logout (API call to clear server session)
      try {
        const { getApiBaseUrl } = await import("@/utils/api");
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
        console.error("Logout error (non-critical):", logoutError);
        // Continue even if logout fails - we'll still clear local storage
      }

      // ✅ STEP 2: Comprehensive cleanup - clear all storage and cookies
      const { clearAllStorage } = await import("@/utils/storageCleanup");
      clearAllStorage();

      // Also clear token via tokenService (dispatches events)
      const tokenService = (await import("@/utils/tokenService")).default;
      tokenService.removeToken();

      // ✅ FIX: Remove token cookie with ALL possible combinations of options
      // Cookies must be removed with the exact same options they were set with
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

      // ✅ FIX: Also use document.cookie directly as a fallback
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

      // Clear sessionStorage and localStorage explicitly
      sessionStorage.clear();
      localStorage.clear();

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 200));

      // ✅ STEP 3: Try to open the mobile app (in background)
      // Detect if we're on Android or iOS
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Deep link to open the mobile app with token (if available)
      // Using scheme from app.json: "wildwatchexpo"
      const appScheme = token
        ? `wildwatchexpo://auth/oauth2/callback?token=${encodeURIComponent(
            token
          )}`
        : "wildwatchexpo://auth/oauth2/callback";

      // Try to open app (non-blocking)
      if (isAndroid) {
        const intentUrl = `intent://auth/oauth2/callback${
          token ? `?token=${encodeURIComponent(token)}` : ""
        }#Intent;scheme=wildwatchexpo;package=com.wildwatch.app;end`;
        // Open in new window/tab (non-blocking)
        window.open(intentUrl, "_blank");
      } else if (isIOS) {
        // For iOS, try to open app
        window.open(appScheme, "_blank");
      }

      // ✅ STEP 4: Always redirect to /login after cleanup
      // This ensures the web session is completely cleared
      router.push("/login");
    } catch (error) {
      console.error("Error during cleanup and redirect:", error);
      // Even if there's an error, try to redirect to login
      // Clear storage as fallback
      try {
        const { clearAllStorage } = await import("@/utils/storageCleanup");
        clearAllStorage();
        const tokenService = (await import("@/utils/tokenService")).default;
        tokenService.removeToken();

        // Remove token cookie with all possible options
        const hostname = window.location.hostname;
        const cookieOptions: Array<{
          path: string;
          secure?: boolean;
          sameSite?: "lax" | "strict" | "none";
        }> = [
          { path: "/" },
          { path: "/", secure: true },
          { path: "/", sameSite: "lax" },
          { path: "/", secure: true, sameSite: "lax" },
        ];

        cookieOptions.forEach((options) => {
          try {
            Cookies.remove("token", options);
          } catch (e) {
            // Ignore errors
          }
        });

        // Use document.cookie as fallback
        const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = `token=;expires=${expireDate};path=/`;
        document.cookie = `token=;expires=${expireDate};path=/;domain=${hostname}`;
        document.cookie = `token=;expires=${expireDate};path=/;domain=.${hostname}`;
      } catch (cleanupError) {
        console.error("Error during fallback cleanup:", cleanupError);
      }
      // Redirect to login
      router.push("/login");
    }
  };

  if (!isMobile) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <div
        className="min-h-screen flex items-start justify-center overflow-y-auto py-10"
        style={{ backgroundColor: "#f5f5f7" }}
      >
        <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20 mx-4 my-10">
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
              Successfully Created Your Account!
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Your account has been successfully created. You can now open the
              WildWatch mobile app to continue.
            </p>
          </div>

          {showSuccessMessage && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-md flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-normal text-green-700">
                Successfully created your account!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#800000]">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Account Created Successfully!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Successfully created your account! You can now open the WildWatch
              mobile app to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleOpenApp}
              className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Open App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#800000]">
              <AlertCircle className="h-6 w-6 text-red-500" />
              App Not Found
            </DialogTitle>
            <DialogDescription className="pt-2">
              {errorMessage ||
                "The WildWatch app doesn't appear to be installed. Please install it and try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorDialog(false)}
              className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
