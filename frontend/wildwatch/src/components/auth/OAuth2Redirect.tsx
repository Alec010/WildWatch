"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleAuthRedirect } from "@/utils/auth";
import userProfileService from "@/utils/userProfileService";

export default function OAuth2Redirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if device is mobile
  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 1024
    );
  };

  useEffect(() => {
    const processLogin = async () => {
      try {
        // Get the encoded data from URL parameters
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const encodedData = urlParams.get("data");
          const token = urlParams.get("token");
          const termsAccepted = urlParams.get("termsAccepted") === "true";

          // Check if we have token directly (new flow from backend)
          if (token) {
            // Store the token using token service
            const tokenService = (await import("@/utils/tokenService")).default;
            tokenService.setToken(token);

            // Fetch user profile to get full user data
            const { getApiBaseUrl } = await import("@/utils/api");
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

            const user = await profileResponse.json();
            const isMobile = isMobileDevice();

            // Check if terms are accepted
            if (!user.termsAccepted || !termsAccepted) {
              sessionStorage.setItem("oauthUserData", JSON.stringify(user));
              if (isMobile) {
                router.push("/mobile/terms");
              } else {
                router.push("/terms");
              }
              return;
            }

            // Check if contact number and password are set (for Microsoft OAuth users)
            if (
              user.authProvider === "microsoft" &&
              (user.contactNumber === "Not provided" ||
                user.contactNumber === "+639000000000" ||
                !user.password)
            ) {
              sessionStorage.setItem("oauthUserData", JSON.stringify(user));
              if (isMobile) {
                router.push("/mobile/setup");
              } else {
                router.push("/auth/setup");
              }
              return;
            }

            // If user is complete and on mobile, show completion page with app redirect
            if (isMobile) {
              router.push("/mobile/complete");
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

            // Use handleAuthRedirect to determine the correct redirect path
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
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing your login...</p>
      </div>
    </div>
  );
}
