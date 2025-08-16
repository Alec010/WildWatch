import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-semibold text-gray-900 mb-2">Report Incident</Text>
        <Text className="text-gray-600">Report a new incident here</Text>
      </View>
    </SafeAreaView>
  );
}
