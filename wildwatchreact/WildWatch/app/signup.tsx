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

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const { register } = useAuth();

  useEffect(() => {
    // Animate form visibility after a delay
    const timer = setTimeout(() => {
      setIsFormVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Helper function to format school ID as 00-0000-000
  const formatSchoolId = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 9)}`;
  };

  const handleRegister = async () => {
    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Privacy Policy');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName,
        lastName,
        middleInitial,
        email,
        schoolIdNumber: schoolId,
        password,
        confirmPassword,
        contactNumber,
        termsAccepted: agreeToTerms,
      });
    } catch (error: any) {
      Alert.alert('Registration Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
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
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            <View className="h-2" />

            {/* Title */}
            <View
              className={`items-center mb-6 ${
                isFormVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                opacity: isFormVisible ? 1 : 0,
                transform: [{ translateY: isFormVisible ? 0 : 20 }],
              }}
            >
              <Text className="text-2xl font-bold text-[#8B0000] mb-1">
                Create Account
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Fill in your details to join WildWatch
              </Text>
            </View>

            {/* Form */}
            <View
              className={`w-full ${
                isFormVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                opacity: isFormVisible ? 1 : 0,
                transform: [{ translateY: isFormVisible ? 0 : 30 }],
              }}
            >
              {/* Name Fields */}
              <View className="mb-6">
                <View className="flex-row mb-3">
                  <Text className="flex-1 text-sm font-medium text-gray-700">First Name</Text>
                  <Text className="w-15 text-sm font-medium text-center text-gray-700">M.I.</Text>
                  <Text className="flex-1 text-sm font-medium text-right text-gray-700">Last Name</Text>
                </View>
                <View className="flex-row space-x-4">
                  <TextInput
                    className="flex-1 h-12 px-3 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    className="w-15 h-12 px-2 border border-gray-300 rounded-lg text-base text-center focus:border-[#8B0000]"
                    placeholder="M.I."
                    placeholderTextColor="#9CA3AF"
                    value={middleInitial}
                    onChangeText={setMiddleInitial}
                    maxLength={1}
                  />
                  <TextInput
                    className="flex-1 h-12 px-3 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-3 text-gray-700">Institutional Email</Text>
                <TextInput
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                  placeholder="your.name@institution.edu"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* School ID */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-3 text-gray-700">School ID</Text>
                <TextInput
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                  placeholder="Enter your school ID"
                  placeholderTextColor="#9CA3AF"
                  value={schoolId}
                  onChangeText={(text) => setSchoolId(formatSchoolId(text))}
                  keyboardType="numeric"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-3 text-gray-700">Password</Text>
                <View className="relative">
                  <TextInput
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                    placeholder="Create a secure password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-3"
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-500 mt-2">
                  Password must be at least 8 characters with uppercase, number, and special character.
                </Text>
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-3 text-gray-700">Confirm Password</Text>
                <View className="relative">
                  <TextInput
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                    placeholder="Confirm password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!confirmPasswordVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-3"
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    <Ionicons
                      name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Contact Number */}
              <View className="mb-8">
                <Text className="text-sm font-medium mb-3 text-gray-700">Contact Number</Text>
                <TextInput
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:border-[#8B0000]"
                  placeholder="Contact Number"
                  placeholderTextColor="#9CA3AF"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Terms and Privacy */}
              <View className="mb-8">
                <View className="flex-row items-start">
                  <TouchableOpacity
                    className="mr-3 mt-1"
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                  >
                    <View
                      className={`w-5 h-5 border-2 rounded ${
                        agreeToTerms ? 'bg-[#8B0000] border-[#8B0000]' : 'border-gray-400'
                      } justify-center items-center`}
                    >
                      {agreeToTerms && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600 leading-4">
                      By creating an account, you agree to our{' '}
                      <Text className="text-[#8B0000] font-bold">Terms of Service</Text>
                      {' '}and{' '}
                      <Text className="text-[#8B0000] font-bold">Privacy Policy</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                className={`w-full h-12 bg-[#8B0000] rounded-xl justify-center items-center mb-6 ${
                  isLoading ? 'opacity-70' : ''
                }`}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-base font-bold">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <View className="flex-row justify-center items-center pb-4">
                <Text className="text-gray-600">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text className="text-[#8B0000] font-bold">Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
