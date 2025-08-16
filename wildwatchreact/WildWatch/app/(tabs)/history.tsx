import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-semibold text-gray-900 mb-2">History</Text>
        <Text className="text-gray-600">Your incident history will appear here</Text>
      </View>
    </SafeAreaView>
  );
}
