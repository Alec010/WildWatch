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
        const { token, termsAccepted } = params;

        if (!token || typeof token !== "string") {
          console.error("❌ [OAUTH CALLBACK] No token received");
          Alert.alert(
            "Authentication Error",
            "No authentication token received. Please try again."
          );
          router.replace("/auth/login");
          return;
        }

        console.log("✅ [OAUTH CALLBACK] Token received, storing...");

        // Store the token
        await storage.setToken(token);

        // Clear profile state to prevent showing old account data
        clearUserProfileState();

        // Fetch user profile to check status
        try {
          const profile = await authAPI.getProfile();

          // Check if terms are accepted
          if (!profile.termsAccepted || termsAccepted !== "true") {
            console.log(
              "📋 [OAUTH CALLBACK] Terms not accepted, navigating to terms page"
            );
            router.replace("/auth/terms");
            return;
          }

          // Check if setup is needed (for Microsoft OAuth users)
          if (
            profile.authProvider === "microsoft" ||
            profile.authProvider === "microsoft_mobile"
          ) {
            const contactNeedsSetup =
              !profile.contactNumber ||
              profile.contactNumber === "Not provided" ||
              profile.contactNumber === "+639000000000";
            const passwordNeedsSetup =
              profile.passwordNeedsSetup !== undefined
                ? profile.passwordNeedsSetup
                : !profile.password;

            if (contactNeedsSetup || passwordNeedsSetup) {
              console.log(
                "⚙️ [OAUTH CALLBACK] Setup needed, navigating to setup page"
              );
              router.replace("/auth/setup");
              return;
            }
          }

          // All steps completed - navigate to dashboard
          console.log(
            "✅ [OAUTH CALLBACK] All steps completed, navigating to dashboard"
          );
          clearUserProfileState();
          router.replace("/(tabs)");
        } catch (profileError) {
          console.error(
            "❌ [OAUTH CALLBACK] Profile fetch error:",
            profileError
          );
          // Navigate to dashboard anyway, let it handle auth requirements
          clearUserProfileState();
          router.replace("/(tabs)");
        }
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
