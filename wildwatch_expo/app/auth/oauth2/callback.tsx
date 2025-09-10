import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { microsoftOAuthService } from '../../../lib/microsoftOAuth';
import { storage } from '../../../lib/storage';

export default function OAuth2Callback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('OAuth callback received with params:', params);
        
        // Check if we have an authorization code
        const { code, error } = params;
        
        if (error) {
          console.error('OAuth error:', error);
          Alert.alert('OAuth Error', 'Authentication failed. Please try again.');
          router.replace('/auth/login');
          return;
        }
        
        if (code) {
          console.log('Processing authorization code...');
          
          // Exchange the code for tokens
          const result = await microsoftOAuthService.exchangeCodeForTokens(code as string);
          
          if (result.token) {
            console.log('Microsoft OAuth successful, saving token and navigating...');
            
            // Save token and navigate simultaneously (don't wait for storage)
            storage.setToken(result.token).catch(err => 
              console.error('Failed to save token:', err)
            );
            
            // Navigate immediately without waiting for storage
            router.replace('/(tabs)');
          } else {
            throw new Error('No token received from OAuth exchange');
          }
        } else {
          throw new Error('No authorization code received');
        }
        
      } catch (error) {
        console.error('OAuth callback error:', error);
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
