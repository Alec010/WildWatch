import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerShadowVisible: false,
        headerBackTitle: "Back",
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
