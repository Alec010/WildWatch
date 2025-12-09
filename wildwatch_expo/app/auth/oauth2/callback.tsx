import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { storage } from "../../../lib/storage";
import { clearUserProfileState } from "../../../src/features/users/hooks/useUserProfile";
import { authAPI } from "../../../src/features/auth/api/auth_api";

export default function OAuth2Callback() {
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔄 [OAUTH CALLBACK] Processing OAuth callback...");

        // Get token from URL parameters
        const { token } = params;

        if (!token || typeof token !== "string") {
          console.error("❌ [OAUTH CALLBACK] No token received");
          Alert.alert(
            "Authentication Error",
            "No authentication token received. Please try again."
          );
          router.replace("/auth/login");
          return;
        }

        // Check if there's an existing logged-in user (app opened from web browser)
        const existingToken = await storage.getToken();
        if (existingToken && existingToken !== token) {
          // App was opened from web browser with a different token
          // Show logout confirmation
          Alert.alert(
            "Logout Current Account?",
            "You are currently logged in with a different account. Do you want to logout and sign in with the new account?",
            [
              {
                text: "No",
                style: "cancel",
                onPress: () => {
                  // User chose not to logout, go back to tabs
                  router.replace("/auth/login");
                },
              },
              {
                text: "Yes",
                style: "destructive",
                onPress: async () => {
                  // User chose to logout, clear all data and continue with new token
                  console.log(
                    "🔄 [OAUTH CALLBACK] User chose to logout current account"
                  );
                  await storage.clearAllUserData();
                  clearUserProfileState();
                  // Continue with the new token flow below
                  await processNewToken(token);
                },
              },
            ]
          );
          return;
        }

        // No existing session or same token, proceed normally
        await processNewToken(token);
      } catch (error: any) {
        console.error("❌ [OAUTH CALLBACK] Error during OAuth callback:", {
          message: error?.message,
          error: error,
        });

        // Check if user cancelled
        if (
          error?.message?.includes("cancelled") ||
          error?.message?.includes("User cancelled")
        ) {
          console.log("ℹ️ [OAUTH CALLBACK] User cancelled OAuth flow");
          router.replace("/auth/login");
          return;
        }

        // Show alert and navigate to login
        Alert.alert(
          "Authentication Error",
          error?.message ||
            "Failed to complete Microsoft login. Please try again."
        );
        router.replace("/auth/login");
      } finally {
        setIsProcessing(false);
      }
    };

    const processNewToken = async (token: string) => {
      try {
        console.log("✅ [OAUTH CALLBACK] Token received, validating...");

        // ✅ IMPROVEMENT: Store token temporarily to validate it
        // This allows the API interceptor to attach it to requests
        await storage.setToken(token);

        // Clear profile state to prevent showing old account data
        clearUserProfileState();

        // ✅ IMPROVEMENT: Validate token by fetching profile before proceeding
        // This ensures the token is valid and works for both Expo Go and production APK
        try {
          console.log(
            "🔄 [OAUTH CALLBACK] Validating token with profile fetch..."
          );
          await authAPI.getProfile();
          console.log("✅ [OAUTH CALLBACK] Token validated successfully");
        } catch (validationError: any) {
          // Token validation failed - determine if it's a network or auth error
          console.error(
            "❌ [OAUTH CALLBACK] Token validation failed:",
            validationError
          );

          // Check if it's a network error (common in APK preview scenarios)
          const isNetworkError =
            validationError?.code === "ECONNABORTED" ||
            validationError?.code === "ERR_NETWORK" ||
            validationError?.message?.includes("Network") ||
            validationError?.message?.includes("timeout") ||
            !validationError?.response;

          if (isNetworkError) {
            // Network error - token might still be valid, keep it stored and allow retry
            // This is important for APK preview scenarios where network might be unstable
            Alert.alert(
              "Connection Error",
              "Unable to validate authentication token. Please check your internet connection and try again.",
              [
                {
                  text: "Retry",
                  onPress: async () => {
                    // Retry validation (token is still stored)
                    try {
                      await authAPI.getProfile();
                      console.log(
                        "✅ [OAUTH CALLBACK] Token validated on retry"
                      );
                      router.replace("/(tabs)");
                    } catch (retryError: any) {
                      // Still failed - could be network or auth error
                      console.error(
                        "❌ [OAUTH CALLBACK] Retry validation failed"
                      );

                      // Check if it's still a network error
                      const isStillNetworkError =
                        retryError?.code === "ECONNABORTED" ||
                        retryError?.code === "ERR_NETWORK" ||
                        retryError?.message?.includes("Network") ||
                        retryError?.message?.includes("timeout") ||
                        !retryError?.response;

                      if (
                        !isStillNetworkError &&
                        retryError?.response?.status === 401
                      ) {
                        // Auth error - token is invalid, remove it
                        await storage.removeToken();
                        clearUserProfileState();
                      }

                      router.replace("/auth/login");
                    }
                  },
                },
                {
                  text: "Go to Login",
                  style: "cancel",
                  onPress: async () => {
                    // Remove token when user chooses to go to login
                    await storage.removeToken();
                    clearUserProfileState();
                    router.replace("/auth/login");
                  },
                },
              ]
            );
            return;
          }

          // Token is invalid (401, 403, etc.) - remove it and show error
          await storage.removeToken();
          clearUserProfileState();

          Alert.alert(
            "Authentication Error",
            "The authentication token is invalid or expired. Please try logging in again.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/auth/login"),
              },
            ]
          );
          return;
        }

        // Token is valid - proceed with navigation
        // Terms and setup are handled on the web frontend (mobile/terms -> mobile/setup -> mobile/complete)
        // When the app is opened from mobile/complete, the user has already completed these steps
        // So we can go directly to the dashboard
        console.log(
          "✅ [OAUTH CALLBACK] User completed terms/setup on web, navigating to dashboard"
        );
        router.replace("/(tabs)");
      } catch (error: any) {
        console.error("❌ [OAUTH CALLBACK] Error processing new token:", error);

        // Clean up on any unexpected error
        await storage.removeToken();
        clearUserProfileState();

        // Re-throw to be handled by outer catch block
        throw error;
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View className="flex-1 justify-center items-center bg-[#f5f5f7]">
      <ActivityIndicator size="large" color="#800000" />
      <Text className="text-lg text-[#800000] mt-4">
        Completing Microsoft login...
      </Text>
      <Text className="text-sm text-gray-500 mt-2">Please wait...</Text>
    </View>
  );
}
