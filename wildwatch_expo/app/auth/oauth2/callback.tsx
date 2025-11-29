import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { microsoftOAuthService } from '../../../lib/microsoftOAuth';
import { storage } from '../../../lib/storage';

export default function OAuth2Callback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      let tokenSaved = false;
      try {
        // Check if we have an authorization code
        const { code, error } = params;
        
        if (error) {
          Alert.alert('OAuth Error', 'Authentication failed. Please try again.');
          router.replace('/auth/login');
          return;
        }
        
        if (code) {
          // Exchange the code for tokens
          const result = await microsoftOAuthService.exchangeCodeForTokens(code as string);
          
          if (result.token) {
            // Check if we have user data in the response
            if (result.user) {
              const user = result.user;
              
              // Store user data temporarily for the registration flow
              await AsyncStorage.setItem('oauthUserData', JSON.stringify(user));
              
              // Check if this is a new user registration (needs terms or setup)
              const needsTerms = !user.termsAccepted;
              const needsSetup = (user.authProvider === 'microsoft' || user.authProvider === 'microsoft_mobile') &&
                                (!user.contactNumber || 
                                 user.contactNumber === 'Not provided' || 
                                 user.contactNumber === '+639000000000' ||
                                 !user.password);
              
              // If user needs to complete registration (terms or setup), don't save token
              // They should log in manually after completing registration
              if (needsTerms || needsSetup) {
                // Don't save token - user must complete registration first
                // STEP 1: Check if terms are accepted (for all OAuth users)
                if (needsTerms) {
                  router.replace('/auth/terms');
                  return;
                }
                
                // STEP 2: Check if contact number and password are set (for Microsoft OAuth users)
                if (needsSetup) {
                  router.replace('/auth/setup');
                  return;
                }
              } else {
                // User has completed registration - save token and log them in
                await storage.setToken(result.token);
                tokenSaved = true;
                
                // Clear OAuth user data as it's no longer needed
                await AsyncStorage.removeItem('oauthUserData');
                router.replace('/(tabs)');
              }
            } else {
              // If no user data, try to fetch profile to check status
              try {
                const { authAPI } = await import('../../../src/features/auth/api/auth_api');
                await authAPI.getProfile();
                router.replace('/(tabs)');
              } catch (profileError) {
                // Navigate anyway, let dashboard handle auth requirements
                router.replace('/(tabs)');
              }
            }
          } else {
            throw new Error('No token received from OAuth exchange');
          }
        } else {
          throw new Error('No authorization code received');
        }
        
      } catch (error: any) {
        // If token was saved, user is likely authenticated
        // Don't show error or redirect to login if authentication succeeded
        if (tokenSaved) {
          // Verify token is still valid by checking if we can get it
          const savedToken = await storage.getToken();
          if (savedToken) {
            // Token exists, user is authenticated - navigate to dashboard
            // The error might be from navigation or other non-critical issues
            try {
              router.replace('/(tabs)');
            } catch (navError) {
              // If navigation fails, at least don't show error to user
              // They're already logged in
              console.warn('Navigation error after successful auth:', navError);
            }
            return;
          }
        }
        
        // Only show error if token wasn't saved (actual authentication failure)
        const errorMessage = error?.message || 'Failed to complete Microsoft login. Please try again.';
        Alert.alert('Authentication Error', errorMessage);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View className="flex-1 justify-center items-center bg-[#f5f5f7]">
      <ActivityIndicator size="large" color="#800000" />
      <Text className="text-lg text-[#800000] mt-4">Completing Microsoft login...</Text>
      <Text className="text-sm text-gray-500 mt-2">Please wait...</Text>
    </View>
  );
}
