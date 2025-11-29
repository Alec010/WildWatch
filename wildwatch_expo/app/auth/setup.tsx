import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../src/features/auth/api/auth_api';
import { storage } from '../../lib/storage';
import Colors from '../../constants/Colors';

const COLORS = {
  maroon: Colors.maroon,
  gold: Colors.gold,
  textMuted: '#666666',
  border: '#E5E7EB',
};

export default function SetupPage() {
  const insets = useSafeAreaInsets();
  const [contactNumber, setContactNumber] = useState('+639');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    contactNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const formatContactNumber = (value: string) => {
    // Remove all non-digits
    let inputValue = value.replace(/\D/g, '');

    // Always ensure it starts with 639
    if (!inputValue.startsWith('639')) {
      inputValue = '639' + inputValue.replace(/^639/, '');
    }

    // Format the number as +63 ### ### ####
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

    // Limit total length
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16);
    }

    return formattedValue;
  };

  const getRawContactNumber = (formattedNumber: string) =>
    formattedNumber.replace(/\s/g, '');

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate contact number
    const rawContact = getRawContactNumber(contactNumber);
    if (rawContact.length < 12 || rawContact.length > 15) {
      newErrors.contactNumber = 'Contact number must be between 11-13 digits';
    } else if (!/^\+63[0-9]+$/.test(rawContact)) {
      newErrors.contactNumber = 'Contact number must be a valid Philippines number';
    }

    // Validate password
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const rawContact = getRawContactNumber(contactNumber);
      
      // Check user's auth provider to determine which endpoint to use
      // If user has "microsoft" provider (from web OAuth), we need to use web endpoint
      // If user has "microsoft_mobile" provider, use mobile endpoint
      try {
        const profile = await authAPI.getProfile();
        const authProvider = profile.authProvider;
        
        // If provider is "microsoft" (web OAuth), try web endpoint first
        if (authProvider === 'microsoft') {
          try {
            const { api } = await import('../../lib/api');
            const response = await api.post<{ message: string }>('/auth/setup', {
              contactNumber: rawContact,
              password,
            });
            
            // Clear OAuth user data and token
            await AsyncStorage.removeItem('oauthUserData');
            await storage.removeToken(); // Remove token so user must log in manually
            
            Alert.alert(
              'Setup Complete',
              'Your account setup is complete. Please log in to access your account.',
              [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
            return;
          } catch (webError: any) {
            // If web endpoint fails, fall through to try mobile endpoint
            console.warn('Web setup endpoint failed, trying mobile endpoint:', webError);
          }
        }
      } catch (profileError) {
        // If we can't get profile, continue with mobile endpoint
        console.warn('Could not fetch profile, using mobile endpoint:', profileError);
      }
      
      // Try mobile endpoint (for microsoft_mobile users or as fallback)
      await authAPI.setupOAuthUser(rawContact, password);

      // Clear OAuth user data and token
      await AsyncStorage.removeItem('oauthUserData');
      await storage.removeToken(); // Remove token so user must log in manually

      Alert.alert(
        'Setup Complete',
        'Your account setup is complete. Please log in to access your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      console.error('Setup error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to complete setup. Please try again.';
      
      // Provide helpful error message if it's a provider mismatch
      if (errorMessage.includes('Microsoft Mobile OAuth users') || errorMessage.includes('Current provider: microsoft')) {
        Alert.alert(
          'Setup Failed',
          'Your account was created via web OAuth. Please contact support or try logging in through the web application to complete setup.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Setup Failed',
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top : 0;

  // Password validation indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardBehavior as any}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {/* Top section with gradient and logo */}
        <View style={styles.top}>
          <LinearGradient
            colors={["#9e0202", "#7d0101", "#510000", "#1a0000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.logoWrap} accessible accessibilityRole="image">
            <Image 
              source={require('../../assets/images/logos/logo2.png')} 
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="WildWatch logo"
            />
          </View>
        </View>

        {/* Bottom white card section */}
        <View style={styles.bottom}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Card */}
            <View style={styles.mainCard}>
              {/* Decorative blur elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />

              {/* Title */}
              <View style={styles.headerSection}>
                <Text style={styles.title}>Complete Your Account Setup</Text>
                <Text style={styles.subtitle}>
                  Please provide your contact number and set a password for field login.
                </Text>
              </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Note:</Text> Your account setup is almost complete. This
                information will be used for authentication and important notifications.
              </Text>
            </View>

          {/* Contact Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number *</Text>
            <View style={[styles.inputRow, errors.contactNumber && styles.inputError]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={COLORS.maroon}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.input}
                placeholder="+63 9## ### ####"
                placeholderTextColor={COLORS.textMuted}
                value={contactNumber}
                onChangeText={(text) => setContactNumber(formatContactNumber(text))}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
            {errors.contactNumber && (
              <Text style={styles.errorText}>{errors.contactNumber}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.maroon}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Create a secure password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 12 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.maroon}
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Password Requirements Grid (matching web version) */}
            <View style={styles.requirementsGrid}>
              <View style={styles.requirementItem}>
                <View
                  style={[
                    styles.requirementDot,
                    passwordChecks.length && styles.requirementDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordChecks.length && styles.requirementTextActive,
                  ]}
                >
                  8+ characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View
                  style={[
                    styles.requirementDot,
                    passwordChecks.uppercase && styles.requirementDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordChecks.uppercase && styles.requirementTextActive,
                  ]}
                >
                  Uppercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View
                  style={[
                    styles.requirementDot,
                    passwordChecks.lowercase && styles.requirementDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordChecks.lowercase && styles.requirementTextActive,
                  ]}
                >
                  Lowercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View
                  style={[
                    styles.requirementDot,
                    passwordChecks.number && styles.requirementDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordChecks.number && styles.requirementTextActive,
                  ]}
                >
                  Number
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View
                  style={[
                    styles.requirementDot,
                    passwordChecks.special && styles.requirementDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.requirementText,
                    passwordChecks.special && styles.requirementTextActive,
                  ]}
                >
                  Special character
                </Text>
              </View>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.maroon}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ paddingHorizontal: 12 }}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.maroon}
                />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

            {/* Error message */}
            {errors.contactNumber || errors.password || errors.confirmPassword ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.maroon} />
                <Text style={styles.errorContainerText}>
                  {errors.contactNumber || errors.password || errors.confirmPassword}
                </Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Complete Setup"
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitButtonText}>Setting up...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.submitButtonText}>Complete Setup</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </View>
              )}
            </Pressable>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              By completing this setup, you agree to our{' '}
              <Text style={styles.footerLink}>Terms and Conditions</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SHEET_RADIUS = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
  },
  top: {
    flex: 3,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  bottom: {
    flex: 7,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    marginTop: -32,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    paddingTop: 32,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 24,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 80,
    right: -100,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.gold + '20',
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 80,
    left: -100,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.maroon + '20',
    opacity: 0.3,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.maroon,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  infoBanner: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
    marginHorizontal: 24,
  },
  label: {
    color: Colors.maroon,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '66',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.maroon,
    borderRadius: 8,
  },
  errorContainerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
    marginHorizontal: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  requirementDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    marginRight: 6,
  },
  requirementDotActive: {
    backgroundColor: '#16A34A',
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
  },
  requirementTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.maroon,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 56,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 24,
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.maroon,
    fontWeight: '600',
  },
});

