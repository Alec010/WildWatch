import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    // Animate form visibility after a delay
    const timer = setTimeout(() => {
      setIsFormVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (): boolean => {
    if (email.trim() === '') {
      setEmailError('Email is required');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (!email.endsWith('.edu')) {
      setEmailError('Please use an institutional email (.edu)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (): boolean => {
    if (password.trim() === '') {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleLogin = async () => {
    if (!validateEmail() || !validatePassword()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';
      
      if (error.message?.includes('credentials')) {
        setPasswordError('Invalid email or password');
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    Alert.alert('Microsoft Login', 'Microsoft OAuth login will be implemented here');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1"
        >
          <View className="flex-1 px-4 items-center pt-0">
            {/* Logo */}
            <View
              className={`w-32 h-32 mb-2 ${
                isFormVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                opacity: isFormVisible ? 1 : 0,
                transform: [{ scale: isFormVisible ? 1 : 0.8 }],
              }}
            >
              <Image
                source={require('../assets/images/WildWatch.png')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>

            <View className="h-2" />

            {/* Title */}
            <View
              className={`items-center mb-4 mt-4 ${
                isFormVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                opacity: isFormVisible ? 1 : 0,
                transform: [{ translateY: isFormVisible ? 0 : 20 }],
              }}
            >
              <Text className="text-2xl font-bold text-[#8B0000] mb-1">
                Welcome to WildWatch
              </Text>
              <Text className="text-base text-gray-600 mb-9">
                Sign in to continue
              </Text>
            </View>

            {/* Login Form */}
            <View
              className={`w-full max-w-sm ${
                isFormVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                opacity: isFormVisible ? 1 : 0,
                transform: [{ translateY: isFormVisible ? 0 : 30 }],
              }}
            >
              

              {/* Email Field */}
              <View className="mb-2">
                <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                  Institutional Email
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailError ? '#EF4444' : '#6B7280'}
                    />
                  </View>
                  <TextInput
                    className={`w-full h-12 pl-12 pr-10 border rounded-xl text-base ${
                      emailError
                        ? 'border-red-500'
                        : 'border-gray-300 focus:border-[#8B0000]'
                    }`}
                    placeholder="your.name@institution.edu"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) validateEmail();
                    }}
                    onBlur={validateEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {emailError && (
                    <View className="absolute right-3 top-3">
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </View>
                  )}
                </View>
                {emailError && (
                  <Text className="text-red-500 text-sm mt-1 ml-1">
                    {emailError}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View className="mb-2">
                <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordError ? '#EF4444' : '#6B7280'}
                    />
                  </View>
                  <TextInput
                    className={`w-full h-12 pl-12 pr-12 border rounded-xl text-base ${
                      passwordError
                        ? 'border-red-500'
                        : 'border-gray-300 focus:border-[#8B0000]'
                    }`}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) validatePassword();
                    }}
                    onBlur={validatePassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-3"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <Text className="text-red-500 text-sm mt-1 ml-1">
                    {passwordError}
                  </Text>
                )}
              </View>

              {/* Forgot Password */}
              <View className="items-end mb-4">
                <TouchableOpacity>
                  <Text className="text-[#8B0000] font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                className={`w-full h-12 bg-[#8B0000] rounded-xl justify-center items-center mb-4 ${
                  isLoading ? 'opacity-70' : ''
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-base font-bold">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-3 text-gray-500">OR</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Microsoft Sign In Button */}
              <TouchableOpacity
                className="w-full h-12 border border-[#8B0000] rounded-xl justify-center items-center mb-4"
                onPress={handleMicrosoftLogin}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="logo-microsoft"
                    size={20}
                    color="#8B0000"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-[#8B0000] font-medium">
                    Sign in with Microsoft
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Microsoft Note */}
              {screenHeight > 500 && (
                <View className="w-full bg-gray-100 rounded-lg p-3 mb-4">
                  <Text className="text-xs text-gray-600 text-center">
                    Note: When signing in with Microsoft, additional credentials may be required after authentication.
                  </Text>
                </View>
              )}

              {/* Create Account Link */}
              <View className="flex-row justify-center items-center mt-4">
                <Text className="text-gray-600">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text className="text-[#8B0000] font-bold">Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
