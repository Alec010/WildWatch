import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../auth/api/auth_api';
import { storage } from '../../../../lib/storage';
import { microsoftOAuthService } from '../../../../lib/microsoftOAuth';

export const useAuthLogin = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(email, password);
      await storage.setToken(res.token);
      router.replace('/(tabs)');
    } catch (e: any) {
      const message: string = e?.response?.data?.message || e?.message || 'Login failed. Please try again.';
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await microsoftOAuthService.signInWithMicrosoft();
      if (result?.token) {
        await storage.setToken(result.token);
        
        // Check if we have user data in the response to determine routing
        if (result.user) {
          const user = result.user;
          
          // Store user data temporarily for the registration flow
          await AsyncStorage.setItem('oauthUserData', JSON.stringify(user));
          
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
          
          // All registration steps completed
          // Clear OAuth user data as it's no longer needed
          await AsyncStorage.removeItem('oauthUserData');
          router.replace('/(tabs)');
        } else {
          // If no user data, navigate to dashboard (will handle auth requirements there)
          router.replace('/(tabs)');
        }
        return;
      }
      throw new Error('No token received from Microsoft OAuth');
    } catch (e: any) {
      const message: string = e?.message || 'Microsoft login failed. Please try again.';
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, login, loginWithMicrosoft };
};


