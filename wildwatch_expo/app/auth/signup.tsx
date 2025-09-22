import { View, Text, TextInput, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthSignup } from '../../src/features/auth/hooks/useAuthSignup';
import TermsModal from '../../components/TermsModal';

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
  const [showTerms, setShowTerms] = useState(false);
  const { isLoading, register } = useAuthSignup();

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

    try {
      const rawContactNumber = getRawContactNumber(contactNumber.trim());
      await register({
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
      
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please sign in.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
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
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-1 justify-center px-4 py-8">
        {/* Top Gradient Bar */}
        <View className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000]" />

        {/* Logo */}
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/logos/logo.png')}
            className="w-32 h-16"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#800000] mt-8">Create Account</Text>
          <Text className="text-sm text-gray-600 mt-2">Join WILD WATCH to report and track campus incidents</Text>
        </View>

        {/* Signup Form */}
        <View className="space-y-4 px-4">
          {/* Name Fields */}
          <View className="flex-row space-x-2">
            <View className="flex-1">
              <Text className="text-[#800000] font-semibold mb-2">First Name *</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
                <Ionicons name="person-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 p-4"
                  placeholder="Enter first name"
                placeholderTextColor="#666"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>
            <View className="w-16">
              <Text className="text-[#800000] font-semibold mb-2">M.I.</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
                <TextInput
                  className="flex-1 p-4 text-center"
                  placeholder="M.I."
                  placeholderTextColor="#666"
                  value={middleInitial}
                  onChangeText={setMiddleInitial}
                  maxLength={1}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[#800000] font-semibold mb-2">Last Name *</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
                <Ionicons name="person-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 p-4"
                  placeholder="Enter last name"
                placeholderTextColor="#666"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          {/* CIT Email */}
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

          {/* School ID Number */}
          <View>
            <Text className="text-[#800000] font-semibold mb-2">School ID Number *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="card-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="22-0603-284"
                placeholderTextColor="#666"
                value={schoolIdNumber}
                onChangeText={(text) => setSchoolIdNumber(formatSchoolId(text))}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text className="text-[#800000] font-semibold mb-2">Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Create a secure password"
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

          {/* Confirm Password */}
          <View>
            <Text className="text-[#800000] font-semibold mb-2">Confirm Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="lock-closed-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="Confirm your password"
                placeholderTextColor="#666"
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

          {/* Contact Number */}
          <View>
            <Text className="text-[#800000] font-semibold mb-2">Contact Number *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Ionicons name="call-outline" size={20} color="#800000" style={{ marginLeft: 12 }} />
              <TextInput
                className="flex-1 p-4"
                placeholder="+63XXXXXXXXXX"
                placeholderTextColor="#666"
                value={contactNumber}
                onChangeText={(text) => setContactNumber(formatContactNumber(text))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Terms and Conditions */}
          <View className="bg-[#FFF8E1] rounded-lg p-4 mt-4">
            <View className="flex-row items-start">
              <Pressable
                onPress={() => setAcceptTerms(!acceptTerms)}
                className="w-5 h-5 border border-gray-300 rounded mr-2 mt-0.5 bg-white items-center justify-center"
              >
                {acceptTerms && (
                  <Ionicons name="checkmark" size={16} color="#800000" />
                )}
              </Pressable>
              <Text className="text-sm text-gray-600 flex-1">
                By creating an account, you agree to our{' '}
                <Text 
                  className="text-[#800000] font-medium" 
                  onPress={() => setShowTerms(true)}
                >
                  Terms and Conditions
                </Text>
              </Text>
            </View>
          </View>

          {/* Create Account Button */}
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
                onPress={() => router.push('/auth/login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Terms Modal */}
      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setAcceptTerms(true);
          setShowTerms(false);
        }}
        isLoading={isLoading}
      />
    </ScrollView>
  );
} 