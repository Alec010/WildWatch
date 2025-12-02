import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { storage } from "../lib/storage";
import { authAPI } from "@/src/features/auth/api/auth_api";
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

  // Add refs to prevent infinite loops and race conditions
  const isNavigatingRef = useRef<boolean>(false);
  const lastPathnameRef = useRef<string | null>(null);
  const checkAuthInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    // Prevent infinite loops by checking if pathname actually changed
    if (lastPathnameRef.current === pathname && hasCheckedAuth) {
      return;
    }

    // Prevent concurrent auth checks
    if (checkAuthInProgressRef.current) {
      return;
    }

    // Prevent navigation if already navigating
    if (isNavigatingRef.current) {
      return;
    }

    const checkAuth = async () => {
      checkAuthInProgressRef.current = true;
      lastPathnameRef.current = pathname;

      // Safe navigation helper - moved outside if/else blocks
      const safeNavigate = async (route: string) => {
        if (isNavigatingRef.current) return;
        if (pathname === route || pathname?.startsWith(route)) return;

        try {
          isNavigatingRef.current = true;
          await router.replace(route as never);
        } catch (navError: any) {
          console.error(`Navigation error to ${route}:`, navError);
          // Don't crash - just log the error
        } finally {
          // Reset after a delay to allow navigation to complete
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }
      };

      try {
        const token = await storage.getToken();
        const authed = Boolean(token);
        setIsAuthenticated(authed);

        if (authed) {
          // Check if terms are accepted by fetching user profile
          let userProfile;
          let termsAccepted = false;

          try {
            userProfile = await authAPI.getProfile();
            termsAccepted = userProfile?.termsAccepted ?? false;
          } catch (profileError: any) {
            console.error("Error fetching profile:", profileError);
            // If profile fetch fails with 401, user is not authenticated
            if (profileError?.response?.status === 401) {
              await storage.removeToken();
              setIsAuthenticated(false);
              if (pathname?.startsWith("/(tabs)")) {
                await safeNavigate("/auth/login");
              }
              return;
            }
            // For other errors, assume terms not accepted to be safe
            termsAccepted = false;
          }

          // Remove the safeNavigate definition from here (line 122-138)

          if (
            !termsAccepted &&
            !pathname?.startsWith("/auth/terms") &&
            !pathname?.startsWith("/auth/setup")
          ) {
            await safeNavigate("/auth/terms");
          } else if (
            pathname?.startsWith("/auth") &&
            termsAccepted &&
            !pathname?.startsWith("/auth/setup")
          ) {
            // Check if user needs setup before redirecting to tabs
            try {
              const isMicrosoftOAuth =
                userProfile?.authProvider === "microsoft" ||
                userProfile?.authProvider === "microsoft_mobile";
              const needsSetup =
                isMicrosoftOAuth &&
                (userProfile?.contactNumber === "+639000000000" ||
                  userProfile?.contactNumber === "Not provided" ||
                  userProfile?.contactNumber === null ||
                  !userProfile?.password);

              if (needsSetup) {
                if (!pathname?.startsWith("/auth/setup")) {
                  await safeNavigate("/auth/setup");
                }
              } else {
                if (
                  !pathname?.startsWith("/auth/terms") &&
                  !pathname?.startsWith("/auth/setup")
                ) {
                  await safeNavigate("/(tabs)");
                }
              }
            } catch (e) {
              console.error("Error checking setup status:", e);
              // If check fails and we're on an auth page that might need setup, don't redirect
              if (
                !pathname?.startsWith("/auth/terms") &&
                !pathname?.startsWith("/auth/setup")
              ) {
                await safeNavigate("/(tabs)");
              }
            }
          }
        } else if (pathname?.startsWith("/(tabs)")) {
          await safeNavigate("/auth/login");
        }
      } catch (error: any) {
        console.error("Auth check error:", error);
        // On error, assume not authenticated
        setIsAuthenticated(false);
        if (pathname?.startsWith("/(tabs)")) {
          await safeNavigate("/auth/login");
        }
      } finally {
        setHasCheckedAuth(true);
        checkAuthInProgressRef.current = false;
      }
    };

    checkAuth();
  }, [pathname, hasCheckedAuth]); // Added hasCheckedAuth to dependencies

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
