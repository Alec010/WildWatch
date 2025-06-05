import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Stack.Screen options={{ title: 'Profile' }} />
      <Text className="text-xl font-bold text-gray-800">Profile Screen</Text>
      <Text className="mt-2 text-gray-600">Welcome to your profile!</Text>
    </View>
  );
} 