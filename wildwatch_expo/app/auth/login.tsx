import { View, Text, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthLogin } from '../../src/features/auth/hooks/useAuthLogin';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login, loginWithMicrosoft } = useAuthLogin();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    try { await login(email, password); } catch {}
  };

  const handleMicrosoftLogin = async () => {
    try { await loginWithMicrosoft(); } catch (e: any) { Alert.alert('Microsoft Login Error', e?.message || 'Microsoft login failed. Please try again.'); }
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
          <Text className="text-3xl font-bold text-[#800000] mt-8">Sign In</Text>
          <Text className="text-sm text-gray-600 mt-2">Access your WILD WATCH account</Text>
        </View>

        {/* Login Form */}
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

          {/* Password Input */}
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[#800000] font-semibold">Password *</Text>
              <Pressable onPress={() => router.push('/auth/forgot-password')}>
                <Text className="text-gray-600">Forgot Password?</Text>
              </Pressable>
            </View>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="pr-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#800000"
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`p-4 rounded-lg mt-6 ${isLoading ? 'bg-gray-400' : 'bg-[#800000]'}`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-gray-300" />
            <Text className="mx-4 text-gray-500 text-sm">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-300" />
          </View>

          {/* Microsoft Login Button */}
          <Pressable
            onPress={handleMicrosoftLogin}
            disabled={isLoading}
            className={`flex-row items-center justify-center border border-gray-300 p-4 rounded-lg bg-white ${isLoading ? 'opacity-50' : ''}`}
          >
            <Image
              source={require('../../assets/images/logos/microsoft_logo.png')}
              className="w-5 h-5 mr-2"
              resizeMode="contain"
            />
            <Text className="text-gray-700 font-medium">
              {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Text>
          </Pressable>

          {/* Note */}
          <Text className="text-xs text-gray-500 text-center mt-4">
            Note: When signing in with Microsoft, additional credentials may be required after authentication.
          </Text>

          {/* Sign Up Link */}
          <View className="mt-6">
            <Text className="text-gray-600 text-center">
              Don't have an account?{' '}
              <Text 
                className="text-[#800000] font-medium"
                onPress={() => router.push('/auth/signup')}
              >
                Create Account
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 