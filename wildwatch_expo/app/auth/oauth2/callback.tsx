import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { storage } from "../../../lib/storage";
import { clearUserProfileState } from "../../../src/features/users/hooks/useUserProfile";

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
        console.log("✅ [OAUTH CALLBACK] Token received, storing...");

        // Store the token
        await storage.setToken(token);

        // Clear profile state to prevent showing old account data
        clearUserProfileState();

        // Terms and setup are handled on the web frontend (mobile/terms -> mobile/setup -> mobile/complete)
        // When the app is opened from mobile/complete, the user has already completed these steps
        // So we can go directly to the dashboard
        console.log(
          "✅ [OAUTH CALLBACK] User completed terms/setup on web, navigating to dashboard"
        );
        router.replace("/(tabs)");
      } catch (error: any) {
        console.error("❌ [OAUTH CALLBACK] Error processing new token:", error);
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
