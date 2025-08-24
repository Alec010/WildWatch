import { View, Text, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../lib/api';
import { storage } from '../../lib/storage';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('');
  const [schoolIdNumber, setSchoolIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || 
        !schoolIdNumber.trim() || !password || !confirmPassword || !contactNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      // Debug: Log the contact number processing
      const rawContactNumber = getRawContactNumber(contactNumber.trim());
      console.log('Original contact number:', contactNumber);
      console.log('Raw contact number (no spaces):', rawContactNumber);
      
      // Call the backend registration API
      const response = await authAPI.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        email: email.trim(),
        schoolIdNumber: schoolIdNumber.trim(),
        password,
        confirmPassword,
        contactNumber: rawContactNumber,
        termsAccepted: acceptTerms
      });
      
      // Save the token
      await storage.setToken(response.token);
      
      // Navigate to main app
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSchoolId = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");
    // Format as XX-XXXX-XXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 9)}`;
  };

  const formatContactNumber = (value: string) => {
    // Remove all non-digits
    let inputValue = value.replace(/\D/g, '');
    // Always ensure it starts with +63
    if (!inputValue.startsWith('639')) {
      inputValue = '639' + inputValue.replace(/^639/, '');
    }
    // Format the number as +63### ### #### for display
    let formattedValue = '+63';
    if (inputValue.length > 2) {
      const remainingDigits = inputValue.slice(2);
      if (remainingDigits.length > 0) {
        formattedValue += ' ' + remainingDigits.slice(0, 3);
      }
      if (remainingDigits.length > 3) {
        formattedValue += ' ' + remainingDigits.slice(3, 6);
      }
      if (remainingDigits.length > 6) {
        formattedValue += ' ' + remainingDigits.slice(6, 10);
      }
    }
    return formattedValue;
  };

  // Function to get the raw contact number (without spaces) for API calls
  const getRawContactNumber = (formattedNumber: string) => {
    return formattedNumber.replace(/\s/g, '');
  };

  return (
    <ScrollView className="flex-1 bg-[#f5f5f7]">
      <Stack.Screen options={{ title: 'Sign Up' }} />
      
      <View className="flex-1 justify-center px-4 py-8">
        {/* Logo */}
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/logos/logo.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#800000] mt-4">Create Account</Text>
          <Text className="text-sm text-gray-500 mt-2">Join WILD WATCH today</Text>
        </View>

        {/* Signup Form */}
        <View className="space-y-4">
          {/* Name Fields */}
          <View className="flex-row space-x-2">
            <View className="flex-1">
              <Text className="text-[#800000] font-medium mb-2">First Name *</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
                <Ionicons name="person-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 p-4"
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>
            <View className="w-16">
              <Text className="text-[#800000] font-medium mb-2">M.I.</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
                <TextInput
                  className="flex-1 p-4 text-center"
                  placeholder="M.I."
                  value={middleInitial}
                  onChangeText={setMiddleInitial}
                  maxLength={1}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[#800000] font-medium mb-2">Last Name *</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
                <Ionicons name="person-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 p-4"
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          {/* School ID Number */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">School ID Number *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="card-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="XX-XXXX-XXX"
                value={schoolIdNumber}
                onChangeText={(text) => setSchoolIdNumber(formatSchoolId(text))}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
          </View>

          {/* Email */}
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

          {/* Contact Number */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">Contact Number *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="call-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="+63 ### ### ####"
                value={contactNumber}
                onChangeText={(text) => setContactNumber(formatContactNumber(text))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <View>
            <Text className="text-[#800000] font-medium mb-2">Confirm Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="pr-4"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#800000"
                />
              </Pressable>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View className="flex-row items-center mt-4">
            <Pressable
              onPress={() => setAcceptTerms(!acceptTerms)}
              className="w-5 h-5 border border-gray-300 rounded mr-2 items-center justify-center"
            >
              {acceptTerms && (
                <Ionicons name="checkmark" size={16} color="#800000" />
              )}
            </Pressable>
            <Text className="text-sm text-gray-600 flex-1">
              I agree to the{' '}
              <Text className="text-[#800000]">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-[#800000]">Privacy Policy</Text>
            </Text>
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignup}
            disabled={isLoading}
            className={`p-4 rounded-lg mt-6 ${isLoading ? 'bg-gray-400' : 'bg-[#800000]'}`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>

          {/* Sign In Link */}
          <View className="mt-6">
            <Text className="text-gray-600 text-center">
              Already have an account?{' '}
              <Text 
                className="text-[#800000] font-medium"
                onPress={() => router.back()}
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