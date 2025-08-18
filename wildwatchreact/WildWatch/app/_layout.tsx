import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="caseDetails" options={{ headerShown: false }} />
        <Stack.Screen 
          name="caseDetails/[trackingNumber]" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </AuthProvider>
  );
}
