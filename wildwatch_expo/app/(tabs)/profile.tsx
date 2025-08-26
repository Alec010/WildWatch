import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Profile' }} />
      
      {/* User Info Header */}
      <View className="bg-blue-500 p-6 items-center">
        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3">
          <FontAwesome name="user" size={32} color="#3B82F6" />
        </View>
        <Text className="text-white text-xl font-bold">John Doe</Text>
        <Text className="text-blue-100">john.doe@university.edu</Text>
        <Text className="text-blue-100 text-sm">Student ID: 12345678</Text>
      </View>

      {/* Profile Options */}
      <View className="p-6 space-y-4">
        <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-lg">
          <FontAwesome name="user" size={20} color="#6B7280" />
          <Text className="ml-3 text-gray-700 font-medium">Edit Profile</Text>
          <FontAwesome name="chevron-right" size={16} color="#9CA3AF" className="ml-auto" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-lg">
          <FontAwesome name="bell" size={20} color="#6B7280" />
          <Text className="ml-3 text-gray-700 font-medium">Notifications</Text>
          <FontAwesome name="chevron-right" size={16} color="#9CA3AF" className="ml-auto" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-lg">
          <FontAwesome name="shield" size={20} color="#6B7280" />
          <Text className="ml-3 text-gray-700 font-medium">Privacy Settings</Text>
          <FontAwesome name="chevron-right" size={16} color="#9CA3AF" className="ml-auto" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-lg">
          <FontAwesome name="question-circle" size={20} color="#6B7280" />
          <Text className="ml-3 text-gray-700 font-medium">Help & Support</Text>
          <FontAwesome name="chevron-right" size={16} color="#9CA3AF" className="ml-auto" />
        </TouchableOpacity>
      </View>

      {/* About WildWatch Section */}
      <View className="p-6 bg-gray-50 mx-6 rounded-lg mb-6">
        <Text className="text-gray-800 font-semibold mb-3 text-center">About WildWatch</Text>
        <Text className="text-gray-600 text-sm text-center mb-3">
          Your safety is our priority. Report wildlife incidents and stay informed.
        </Text>
        <View className="space-y-2">
          <Text className="text-gray-700 text-xs">• Report incidents with photos and location</Text>
          <Text className="text-gray-700 text-xs">• Get real-time safety updates</Text>
          <Text className="text-gray-700 text-xs">• Track incident resolution</Text>
        </View>
      </View>

      {/* Logout Button */}
      <View className="p-6">
        <TouchableOpacity className="bg-red-500 p-4 rounded-lg items-center">
          <FontAwesome name="sign-out" size={20} color="white" />
          <Text className="text-white font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 