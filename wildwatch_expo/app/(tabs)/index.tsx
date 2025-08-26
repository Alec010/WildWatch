import { Text, View } from '@/components/Themed';
import { StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white p-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">WildWatch</Text>
        <Text className="text-gray-600 text-lg">Report wildlife incidents and stay safe</Text>
      </View>

      <View className="space-y-4">
        <TouchableOpacity className="bg-blue-500 p-4 rounded-lg flex-row items-center">
          <FontAwesome name="exclamation-triangle" size={24} color="white" className="mr-3" />
          <View className="ml-3 flex-1">
            <Text className="text-white text-lg font-semibold">Report Incident</Text>
            <Text className="text-blue-100">Report a wildlife sighting or safety concern</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-green-500 p-4 rounded-lg flex-row items-center">
          <FontAwesome name="history" size={24} color="white" className="mr-3" />
          <View className="ml-3 flex-1">
            <Text className="text-white text-lg font-semibold">View History</Text>
            <Text className="text-green-100">Check your reported incidents</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-purple-500 p-4 rounded-lg flex-row items-center">
          <FontAwesome name="map-marker" size={24} color="white" className="mr-3" />
          <View className="ml-3 flex-1">
            <Text className="text-white text-lg font-semibold">Safety Map</Text>
            <Text className="text-purple-100">View recent incidents in your area</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="mt-8 p-4 bg-gray-50 rounded-lg">
        <Text className="text-gray-700 font-medium mb-2">Quick Stats</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">12</Text>
            <Text className="text-gray-600 text-sm">Reports This Week</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-600">3</Text>
            <Text className="text-gray-600 text-sm">Active Cases</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-purple-600">98%</Text>
            <Text className="text-gray-600 text-sm">Response Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
