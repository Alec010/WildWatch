import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password-request', { email });

      const data = response.data;

      Alert.alert(
        'Success',
        'Password reset link has been sent to your email.',
        [{ text: 'OK', onPress: () => router.push('/auth/login') }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-1 justify-center px-4 py-8">
        {/* Top Gradient Bar */}
        <View className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000]" />

        {/* Logo */}
        <View className="items-center mb-12">
          <Image
            source={require('../../assets/images/logos/logo.png')}
            className="w-32 h-16"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#800000] mt-8">Reset Password</Text>
          <Text className="text-sm text-gray-600 mt-2">Enter your email to receive a password reset link</Text>
        </View>

        {/* Form */}
        <View className="space-y-4 px-4">
          {/* Email Input */}
          <View>
            <Text className="text-[#800000] font-semibold mb-2">CIT Email *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="mail-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="your.name@cit.edu"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Reset Button */}
          <Pressable
            onPress={handleResetPassword}
            disabled={isLoading}
            className={`p-4 rounded-lg mt-6 ${isLoading ? 'bg-gray-400' : 'bg-[#800000]'}`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Text>
          </Pressable>

          {/* Back to Login */}
          <View className="mt-6">
            <Text className="text-gray-600 text-center">
              Remember your password?{' '}
              <Text 
                className="text-[#800000] font-medium"
                onPress={() => router.push('/auth/login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
