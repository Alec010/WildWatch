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

    // Get token from URL params or cookies
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      const tokenFromCookie = Cookies.get("token");
      const token = tokenFromUrl || tokenFromCookie || null;
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

      // Logout from web session first
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
        // Continue even if logout fails
      }

      // Clear all web storage and cookies
      Cookies.remove("token");
      sessionStorage.clear();
      localStorage.clear();

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Detect if we're on Android or iOS
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Deep link to open the mobile app with token
      // Using scheme from app.json: "wildwatchexpo"
      const appScheme = token
        ? `wildwatchexpo://auth/oauth2/callback?token=${encodeURIComponent(
            token
          )}`
        : "wildwatchexpo://auth/oauth2/callback";

      // For Android, use Intent URL format which provides better error handling
      if (isAndroid) {
        const intentUrl = `intent://auth/oauth2/callback${
          token ? `?token=${encodeURIComponent(token)}` : ""
        }#Intent;scheme=wildwatchexpo;package=com.wildwatch.app;end`;

        // Try intent URL first (better for Android)
        window.location.href = intentUrl;

        // Fallback after delay if app doesn't open
        setTimeout(() => {
          if (document.hasFocus()) {
            // App didn't open, redirect to Play Store
            window.location.href =
              "https://play.google.com/store/apps/details?id=com.wildwatch.app";
          }
        }, 2000);
      } else {
        // For iOS or other platforms, use direct scheme
        const startTime = Date.now();
        window.location.href = appScheme;

        // Fallback after delay if app doesn't open
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          // If page is still focused after 2 seconds, app likely didn't open
          if (document.hasFocus() && elapsed >= 2000) {
            if (isIOS) {
              // For iOS, show error with instructions
              setErrorMessage(
                "The WildWatch app doesn't appear to be installed. Please install it from the App Store and try again."
              );
              setShowErrorDialog(true);
            } else {
              // For other platforms, show generic error
              setErrorMessage(
                "The WildWatch app doesn't appear to be installed. Please install it and try again."
              );
              setShowErrorDialog(true);
            }
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error during app redirect:", error);
      setErrorMessage(
        "Unable to open the app. Please make sure the WildWatch app is installed and try again."
      );
      setShowErrorDialog(true);
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
