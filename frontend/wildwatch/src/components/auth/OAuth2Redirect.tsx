"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleAuthRedirect } from "@/utils/auth";
import userProfileService from "@/utils/userProfileService";
import { clearAllStorage } from "@/utils/storageCleanup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Smartphone } from "lucide-react";
import Cookies from "js-cookie";

export default function OAuth2Redirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check if device is mobile
  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 1024
    );
  };

  // Clear browser data, session, and cache
  const clearBrowserData = () => {
    if (typeof window === "undefined") return;

    try {
      console.log(
        "🧹 Clearing browser data, session, and cache for fresh OAuth flow..."
      );

      // Clear all cookies, localStorage, and sessionStorage
      clearAllStorage();
      Cookies.remove("token");
      sessionStorage.removeItem("oauthUserData");
      localStorage.clear();

      // Clear service worker cache if available (browser cache)
      if ("serviceWorker" in navigator && "caches" in window) {
        caches
          .keys()
          .then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                console.log(`🗑️ Deleting cache: ${cacheName}`);
                return caches.delete(cacheName);
              })
            );
          })
          .then(() => {
            console.log("✅ Service worker caches cleared");
          })
          .catch((e: unknown) => {
            console.warn("Could not clear service worker caches:", e);
          });
      }

      // Clear IndexedDB if available (for cache)
      if ("indexedDB" in window && "databases" in indexedDB) {
        // Modern browsers support indexedDB.databases()
        (indexedDB as any)
          .databases()
          .then((databases: any[]) => {
            databases.forEach((db: any) => {
              console.log(`🗑️ Attempting to clear IndexedDB: ${db.name}`);
              // Note: We can't directly delete IndexedDB from here without opening it
              // But we've logged it for visibility
            });
          })
          .catch((e: unknown) => {
            console.warn("Could not list IndexedDB databases:", e);
          });
      }

      console.log("✅ Browser data, session, and cache cleared");
    } catch (error) {
      console.error("Error clearing browser data:", error);
      // Continue anyway - don't block the OAuth flow
    }
  };

  useEffect(() => {
    const processLogin = async () => {
      try {
        // Clear browser data, session, and cache at the start of OAuth flow
        clearBrowserData();

        // Get the encoded data from URL parameters
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const encodedData = urlParams.get("data");
          const token = urlParams.get("token");
          const termsAccepted = urlParams.get("termsAccepted") === "true";

          // Check if we have token directly (new flow from backend)
          if (token) {
            // Store token temporarily for potential app redirect
            setAuthToken(token);

            // Store the token using token service
            const tokenService = (await import("@/utils/tokenService")).default;
            tokenService.setToken(token);

            // Fetch user profile to get full user data
            const isMobile = isMobileDevice();
            const { getApiBaseUrl } = await import("@/utils/api");
            const apiBaseUrl = getApiBaseUrl();

            const profileResponse = await fetch(
              `${apiBaseUrl}/api/auth/profile`,
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

            const user = await profileResponse.json();

            // For mobile, check if terms are already accepted
            if (isMobile) {
              // Store user data for the mobile flow
              sessionStorage.setItem("oauthUserData", JSON.stringify(user));

              // If terms are already accepted, perform signout and show completion dialog
              if (user.termsAccepted && termsAccepted) {
                // Check if setup is needed first
                const needsSetup =
                  user.authProvider === "microsoft" &&
                  (user.contactNumber === "Not provided" ||
                    user.contactNumber === "+639000000000" ||
                    !user.password);

                if (!needsSetup) {
                  // Terms accepted and setup complete - perform signout and show dialog
                  await performSignout(token);
                  setShowCompleteDialog(true);
                  setIsLoading(false);
                  return;
                } else {
                  // Setup still needed
                  router.push("/mobile/setup");
                  return;
                }
              }

              // Terms not accepted - go to terms page
              if (!user.termsAccepted || !termsAccepted) {
                router.push("/mobile/terms");
                return;
              }

              // Check if setup is needed (for Microsoft OAuth users)
              const needsSetup =
                user.authProvider === "microsoft" &&
                (user.contactNumber === "Not provided" ||
                  user.contactNumber === "+639000000000" ||
                  !user.password);

              if (needsSetup) {
                router.push("/mobile/setup");
                return;
              }

              // If user is complete, show completion page with app redirect
              router.push("/mobile/complete");
              return;
            }

            // For desktop/web only - mobile users should never reach here
            if (!user.termsAccepted || !termsAccepted) {
              sessionStorage.setItem("oauthUserData", JSON.stringify(user));
              router.push("/terms");
              return;
            }

            // Check if setup is needed (for Microsoft OAuth users) - desktop only
            if (
              user.authProvider === "microsoft" &&
              (user.contactNumber === "Not provided" ||
                user.contactNumber === "+639000000000" ||
                !user.password)
            ) {
              sessionStorage.setItem("oauthUserData", JSON.stringify(user));
              router.push("/auth/setup");
              return;
            }

            // Save user profile to sessionStorage for sidebar caching
            userProfileService.setUserProfile({
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              schoolIdNumber: user.schoolIdNumber || "",
              email: user.email || "",
              role: user.role || "",
            });

            // Use handleAuthRedirect to determine the correct redirect path (desktop only)
            const redirectPath = handleAuthRedirect(user);
            router.push(redirectPath);
            return;
          }

          // Legacy flow with encoded data
          if (!encodedData) {
            throw new Error("No data received from OAuth provider");
          }

          // Decode and parse the data
          const data = JSON.parse(decodeURIComponent(encodedData));

          // Store the token using token service (handles automatic refresh)
          const tokenService = (await import("@/utils/tokenService")).default;
          tokenService.setToken(data.token);

          // Check if we have a valid user object
          if (!data.user || !data.user.email) {
            throw new Error("Invalid user data received");
          }

          const isMobile = isMobileDevice();

          // Check if terms are accepted
          if (!data.user.termsAccepted) {
            // Store the user data in session storage to be used after terms acceptance
            sessionStorage.setItem("oauthUserData", JSON.stringify(data.user));
            if (isMobile) {
              router.push("/mobile/terms");
            } else {
              router.push("/terms");
            }
            return;
          }

          // Check if contact number and password are set
          if (
            data.user.authProvider === "microsoft" &&
            (data.user.contactNumber === "Not provided" || !data.user.password)
          ) {
            sessionStorage.setItem("oauthUserData", JSON.stringify(data.user));
            if (isMobile) {
              router.push("/mobile/setup");
            } else {
              router.push("/auth/setup");
            }
            return;
          }

          // Save user profile to sessionStorage for sidebar caching (sanitization handled by service)
          userProfileService.setUserProfile({
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            schoolIdNumber: data.user.schoolIdNumber || "",
            email: data.user.email || "",
            role: data.user.role || "",
          });

          // Use handleAuthRedirect to determine the correct redirect path
          const redirectPath = handleAuthRedirect(data.user);
          router.push(redirectPath);
        } else {
          // If window is not available, redirect to login
          router.push("/login");
        }
      } catch (err) {
        console.error("Error during OAuth redirect:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process login";
        setError(errorMessage);
        // Redirect to login page with error message after a brief delay to show error state
        setTimeout(() => {
          router.push("/login?error=" + encodeURIComponent(errorMessage));
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    processLogin();
  }, [router]);

  // Function to perform signout
  const performSignout = async (token: string | null) => {
    try {
      // STEP 1: Perform server-side logout
      if (token) {
        try {
          const { getApiBaseUrl } = await import("@/utils/api");
          await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
        } catch (logoutError) {
          console.error("Logout error (non-critical):", logoutError);
        }
      }

      // STEP 2: Clear all storage and cookies
      clearAllStorage();
      const tokenService = (await import("@/utils/tokenService")).default;
      tokenService.removeToken();

      // STEP 3: Remove token cookie with all possible combinations
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

      cookieOptions.forEach((options) => {
        try {
          Cookies.remove("token", options);
        } catch (e) {
          // Ignore errors
        }
      });

      // Also use document.cookie directly as fallback
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

      sessionStorage.clear();
      localStorage.clear();
    } catch (error) {
      console.error("Error during signout:", error);
    }
  };

  // Function to handle opening the app
  const handleOpenApp = async () => {
    try {
      const token = authToken;

      // Detect if we're on Android or iOS
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Deep link to open the mobile app with token (if available)
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
        window.open(intentUrl, "_blank");
      } else if (isIOS) {
        window.open(appScheme, "_blank");
      }

      // Redirect to login after opening app
      router.push("/login");
    } catch (error) {
      console.error("Error opening app:", error);
      router.push("/login");
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCompleteDialog ? (
        <div className="flex justify-center items-center min-h-screen bg-[#f5f5f7]">
          <Dialog open={showCompleteDialog} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#800000]">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  You have finished setting up this account
                </DialogTitle>
                <DialogDescription className="pt-2">
                  Your account setup is complete. You can now open the WildWatch
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
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your login...</p>
          </div>
        </div>
      )}
    </>
  );
}
