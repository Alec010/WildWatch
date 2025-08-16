import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-red-600 rounded-full justify-center items-center mb-3">
              <Text className="text-white text-2xl font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>
        </View>

        {/* User Info */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-gray-600">School ID</Text>
              <Text className="text-gray-900 font-medium">{user?.schoolIdNumber}</Text>
            </View>
            
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-gray-600">Contact Number</Text>
              <Text className="text-gray-900 font-medium">{user?.contactNumber}</Text>
            </View>
            
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600">Terms Accepted</Text>
              <View className={`px-2 py-1 rounded-full ${
                user?.termsAccepted ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  user?.termsAccepted ? 'text-green-800' : 'text-red-800'
                }`}>
                  {user?.termsAccepted ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="shield-outline" size={20} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3">
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">About</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="w-full bg-red-600 py-4 rounded-xl justify-center items-center"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-base">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
