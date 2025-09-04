import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function CasesScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Stack.Screen options={{ title: 'Cases' }} />
      <Text className="text-xl font-bold text-gray-800">Cases Tab</Text>
      <Text className="text-gray-600 mt-2">Content coming soon...</Text>
    </View>
  );
}
