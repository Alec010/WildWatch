import { useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { microsoftOAuthService } from "../../../lib/microsoftOAuth";
import { storage } from "../../../lib/storage";
import { clearUserProfileState } from "../../../src/features/users/hooks/useUserProfile";

export default function OAuth2Callback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ✅ FIX: Clear ALL previous session data FIRST before processing new OAuth
        // This ensures no old account data remains when switching accounts
        console.log(
          "🧹 [OAUTH CALLBACK] Clearing all previous session data..."
        );
        await storage.clearAllUserData();

        // ✅ FIX: Clear user profile React state globally
        clearUserProfileState();

        // Check if we have an authorization code
        const { code, error } = params;

        if (error) {
          console.error("❌ [OAUTH CALLBACK] OAuth error in params:", error);
          Alert.alert(
            "OAuth Error",
            "Authentication failed. Please try again."
          );
          router.replace("/auth/login");
          return;
        }

        if (!code) {
          console.error("❌ [OAUTH CALLBACK] No authorization code received");
          Alert.alert(
            "Authentication Error",
            "No authorization code received. Please try again."
          );
          router.replace("/auth/login");
          return;
        }

        // Exchange the code for tokens
        console.log("🔄 [OAUTH CALLBACK] Exchanging code for tokens...");
        const result = await microsoftOAuthService.exchangeCodeForTokens(
          code as string
        );

        if (!result?.token) {
          console.error(
            "❌ [OAUTH CALLBACK] No token received from OAuth exchange"
          );
          throw new Error("No token received from OAuth exchange");
        }

        console.log(
          "✅ [OAUTH CALLBACK] Token received, processing user data..."
        );

        // Check if we have user data in the response
        if (result.user) {
          const user = result.user;

          // Store user data AND token temporarily for the registration flow
          await AsyncStorage.setItem("oauthUserData", JSON.stringify(user));
          await AsyncStorage.setItem("pendingOAuthToken", result.token);

          // ✅ CRITICAL FIX: Store token in storage service so API calls can authenticate
          // This matches the web implementation where token is available for API calls
          await storage.setToken(result.token);

          // STEP 1: Check if terms are accepted (for all OAuth users)
          if (!user.termsAccepted) {
            console.log(
              "📋 [OAUTH CALLBACK] Terms not accepted, navigating to terms page"
            );
            router.replace("/auth/terms");
            return; // ✅ FIX: Return early to prevent error handling
          }

          // STEP 2: Check if contact number and password are set (for Microsoft OAuth users)
          if (
            user.authProvider === "microsoft" ||
            user.authProvider === "microsoft_mobile"
          ) {
            const contactNeedsSetup =
              !user.contactNumber ||
              user.contactNumber === "Not provided" ||
              user.contactNumber === "+639000000000";
            const passwordNeedsSetup = !user.password;

            if (contactNeedsSetup || passwordNeedsSetup) {
              console.log(
                "⚙️ [OAUTH CALLBACK] Setup needed, navigating to setup page"
              );
              router.replace("/auth/setup");
              return; // ✅ FIX: Return early to prevent error handling
            }
          }

          // All registration steps completed - token already stored above
          console.log(
            "✅ [OAUTH CALLBACK] All steps completed, navigating to dashboard"
          );

          // Clear OAuth temporary data as it's no longer needed
          await AsyncStorage.removeItem("oauthUserData");
          await AsyncStorage.removeItem("pendingOAuthToken");
          // ✅ FIX: Clear profile state before navigating to prevent showing old account data
          clearUserProfileState();
          router.replace("/(tabs)");
          return; // ✅ FIX: Return early to prevent error handling
        } else {
          // If no user data, store token and try to fetch profile to check status
          console.log(
            "⚠️ [OAUTH CALLBACK] No user data, storing token and fetching profile"
          );
          await storage.setToken(result.token);
          try {
            const { authAPI } = await import(
              "../../../src/features/auth/api/auth_api"
            );
            await authAPI.getProfile();
            // ✅ FIX: Clear profile state before navigating to prevent showing old account data
            clearUserProfileState();
            router.replace("/(tabs)");
            return; // ✅ FIX: Return early to prevent error handling
          } catch (profileError) {
            console.error(
              "❌ [OAUTH CALLBACK] Profile fetch error:",
              profileError
            );
            // Navigate anyway, let dashboard handle auth requirements
            // ✅ FIX: Clear profile state before navigating to prevent showing old account data
            clearUserProfileState();
            router.replace("/(tabs)");
            return; // ✅ FIX: Return early to prevent error handling
          }
        }
      } catch (error: any) {
        // ✅ FIX: Only show error if navigation hasn't happened
        // Check if this is a user cancellation (don't show error)
        if (
          error?.message?.includes("cancelled") ||
          error?.message?.includes("User cancelled")
        ) {
          console.log("ℹ️ [OAUTH CALLBACK] User cancelled OAuth flow");
          router.replace("/auth/login");
          return;
        }

        // Log the error for debugging
        console.error("❌ [OAUTH CALLBACK] Error during OAuth callback:", {
          message: error?.message,
          error: error,
        });

        // Show alert and navigate to login
        Alert.alert(
          "Authentication Error",
          error?.message ||
            "Failed to complete Microsoft login. Please try again."
        );
        router.replace("/auth/login");
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
