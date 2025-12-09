"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import { clearAllStorage } from "@/utils/storageCleanup";
import tokenService from "@/utils/tokenService";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        setError(null);

        // Step 1: Attempt to call backend logout endpoint (optional - for server-side cleanup)
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

            // Even if logout API fails, we'll still clear local state
            if (!response.ok && response.status !== 404) {
              console.warn(
                "Logout API call failed, but continuing with local logout"
              );
            }
          }
        } catch (apiError) {
          // Logout API might not exist or failed, but we'll still proceed with local logout
          console.warn(
            "Logout API error (continuing with local logout):",
            apiError
          );
        }

        // Step 2: Clear all storage (localStorage, sessionStorage, cookies)
        clearAllStorage();

        // Step 3: Remove token via tokenService (dispatches events for other components)
        tokenService.removeToken();

        // Step 4: Clear any remaining cookies explicitly using js-cookie
        // This ensures all cookie variations are removed
        Cookies.remove("token", { path: "/" });
        Cookies.remove("token", {
          path: "/",
          domain: window.location.hostname,
        });
        Cookies.remove("token", {
          path: "/",
          domain: `.${window.location.hostname}`,
        });

        // Step 5: Small delay to ensure all cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Step 6: Redirect to login page
        router.push("/login");
      } catch (error) {
        console.error("Error during logout:", error);
        setError("An error occurred during logout. Redirecting to login...");

        // Even if there's an error, try to clear storage and redirect
        try {
          clearAllStorage();
          tokenService.removeToken();
          // Wait a bit then redirect
          setTimeout(() => {
            router.push("/login");
          }, 1000);
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
          // Force redirect even if cleanup fails
          window.location.href = "/login";
        }
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {isLoggingOut ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Logging out...</p>
          </>
        ) : error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
