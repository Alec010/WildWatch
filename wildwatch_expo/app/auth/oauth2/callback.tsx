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
            // ⚠️ SECURITY FIX: Do NOT store token yet!
            // Only store after ALL validation passes
            
            // Check if we have user data in the response
            if (result.user) {
              const user = result.user;
              
              // Store user data AND token temporarily for the registration flow
              await AsyncStorage.setItem('oauthUserData', JSON.stringify(user));
              await AsyncStorage.setItem('pendingOAuthToken', result.token);
              
              // STEP 1: Check if terms are accepted (for all OAuth users)
              if (!user.termsAccepted) {
                router.replace('/auth/terms');
                return;
              }
              
              // STEP 2: Check if contact number and password are set (for Microsoft OAuth users)
              if (user.authProvider === 'microsoft' || user.authProvider === 'microsoft_mobile') {
                const contactNeedsSetup = !user.contactNumber || 
                                         user.contactNumber === 'Not provided' || 
                                         user.contactNumber === '+639000000000';
                const passwordNeedsSetup = !user.password;
                
                if (contactNeedsSetup || passwordNeedsSetup) {
                  router.replace('/auth/setup');
                  return;
                }
              }
              
              // All registration steps completed - NOW it's safe to store the token
              await storage.setToken(result.token);
              
              // Clear OAuth temporary data as it's no longer needed
              await AsyncStorage.removeItem('oauthUserData');
              await AsyncStorage.removeItem('pendingOAuthToken');
              router.replace('/(tabs)');
            } else {
              // If no user data, store token and try to fetch profile to check status
              await storage.setToken(result.token);
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
        
      } catch (error) {
        Alert.alert('Authentication Error', 'Failed to complete Microsoft login. Please try again.');
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
