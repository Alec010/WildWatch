import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { storage } from "../lib/storage";
import { authAPI } from "@/src/features/auth/api/auth_api";
import { clearUserProfileState } from "@/src/features/users/hooks/useUserProfile";
import GlobalLayout from "../components/GlobalLayout";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/auth` keeps a back button present.
  initialRouteName: "auth",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [hasCheckedAuth, setHasCheckedAuth] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        
        if (!token) {
          setIsAuthenticated(false);
          if (pathname?.startsWith("/(tabs)")) {
            router.replace("/auth/login");
          }
          setHasCheckedAuth(true);
          return;
        }

        // ✅ FIX: Validate token by attempting to fetch profile
        try {
          // Quick validation - fetch profile to ensure token is valid
          await authAPI.getProfile();
          setIsAuthenticated(true);
          
          // Clear profile state before fetching to prevent showing old account data
          clearUserProfileState();

          // Navigate to tabs if on auth page (except login/oauth callback)
          if (
            pathname?.startsWith("/auth") &&
            !pathname?.startsWith("/auth/login") &&
            !pathname?.startsWith("/auth/oauth2")
          ) {
            router.replace("/(tabs)");
          }
        } catch (error: any) {
          // Token is invalid or expired
          console.log('🔒 Token validation failed, clearing session');
          setIsAuthenticated(false);
          await storage.clearAllUserData();
          clearUserProfileState();
          
          if (pathname?.startsWith("/(tabs)")) {
            router.replace("/auth/login");
          }
        }
      } catch (error) {
        // On error, assume not authenticated
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        await storage.clearAllUserData();
        clearUserProfileState();
        
        if (pathname?.startsWith("/(tabs)")) {
          router.replace("/auth/login");
        }
      } finally {
        setHasCheckedAuth(true);
      }
    };

    checkAuth();
  }, [pathname]);

  if (!hasCheckedAuth) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <GlobalLayout>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="chatbot"
            options={{
              presentation: "transparentModal",
              gestureEnabled: false,
              headerShown: false,
              animation: "slide_from_bottom",
              contentStyle: {
                backgroundColor: "transparent",
              },
            }}
          />
        </Stack>
      </GlobalLayout>
    </ThemeProvider>
  );
}
