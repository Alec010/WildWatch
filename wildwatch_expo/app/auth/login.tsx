import { View, Text, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../lib/api';
import { storage } from '../../lib/storage';
import { microsoftOAuthService } from '../../lib/microsoftOAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      // Call the backend login API
      const response = await authAPI.login(email, password);
      
      // Save the token
      await storage.setToken(response.token);
      
      // Navigate to main app
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Microsoft OAuth login...');
      
      // Start Microsoft OAuth flow
      const result = await microsoftOAuthService.signInWithMicrosoft();
      
      // If successful, save the token and navigate
      if (result.token) {
        console.log('Token received, saving and navigating...');
        
        // Save token and navigate simultaneously (don't wait for storage)
        storage.setToken(result.token).catch(err => 
          console.error('Failed to save token:', err)
        );
        
        // Navigate immediately without waiting for storage
        router.replace('/(tabs)');
      } else {
        throw new Error('No token received from Microsoft OAuth');
      }
      
    } catch (error: any) {
      console.error('Microsoft OAuth error:', error);
      const errorMessage = error.message || 'Microsoft login failed. Please try again.';
      Alert.alert('Microsoft Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#f5f5f7]">
      <Stack.Screen options={{ title: 'Login' }} />
      
      <View className="flex-1 justify-center px-4 py-8">
        {/* Logo */}
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/logos/logo.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#800000] mt-4">Sign In</Text>
          <Text className="text-sm text-gray-500 mt-2">Access your WILD WATCH account</Text>
        </View>

        {/* Login Form */}
        <View className="space-y-4">
          {/* Email Input */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">Email *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="mail-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Enter your password"
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

          {/* Forgot Password Link */}
          <Pressable
            onPress={() => {}}
            className="self-end"
          >
            <Text className="text-[#800000] text-sm">Forgot password?</Text>
          </Pressable>

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
            <Text className="mx-4 text-gray-500">or</Text>
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
              className="w-6 h-6 mr-2"
              resizeMode="contain"
            />
            <Text className="text-gray-700 font-medium">
              {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Text>
          </Pressable>



          {/* Sign Up Link */}
          <View className="mt-6">
            <Text className="text-gray-600 text-center">
              Don't have an account?{' '}
              <Text 
                className="text-[#800000] font-medium"
                onPress={() => router.push('/auth/signup')}
              >
                Sign up
              </Text>
            </Text>
          </View>

          {/* Terms and Privacy */}
          <Text className="text-xs text-gray-500 text-center mt-8">
            By signing in, you agree to our{' '}
            <Text className="text-[#800000]">Terms of Service</Text>
            {' '}and{' '}
            <Text className="text-[#800000]">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
} 