import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        // User is authenticated, redirect to dashboard
        router.replace("/(tabs)/dashboard");
      } else {
        // User is not authenticated, redirect to login
        router.replace("/login");
      }
    }
  }, [token, isLoading]);

  // Show loading screen while checking authentication
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
      }}
    >
      <View className="w-20 h-20 bg-red-600 rounded-2xl justify-center items-center mb-4">
        <Text className="text-white text-2xl font-bold">WW</Text>
      </View>
      <Text className="text-xl font-semibold text-gray-900 mb-2">WildWatch</Text>
      <Text className="text-gray-600 mb-6">Loading...</Text>
      <ActivityIndicator size="large" color="#DC2626" />
    </View>
  );
}
