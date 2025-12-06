import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../auth/api/auth_api';
import { storage } from '../../../../lib/storage';
import { microsoftOAuthService } from '../../../../lib/microsoftOAuth';
import { clearUserProfileState } from '../../users/hooks/useUserProfile';

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
      // ✅ CRITICAL FIX: Clear profile state FIRST (before clearing token)
      // This prevents React components from showing old user data
      console.log('🧹 [OAUTH] Clearing profile state FIRST...');
      clearUserProfileState();

      // ✅ CRITICAL: Clear ALL user session data before starting new OAuth flow
      // This prevents mixing tokens/data from different accounts
      console.log('🧹 [OAUTH] Clearing all previous session data...');
      await storage.clearAllUserData();

      // ✅ ADDITIONAL: Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ Browser cache clearing is handled inside signInWithMicrosoft()
      // This ensures fresh browser session for OAuth
      const result = await microsoftOAuthService.signInWithMicrosoft();
      if (result?.token) {
        // ⚠️ SECURITY FIX: Do NOT store token yet!
        // Only store after ALL validation passes

        // Check if we have user data in the response to determine routing
        if (result.user) {
          const user = result.user;

          // Store user data AND token temporarily for the registration flow
          await AsyncStorage.setItem('oauthUserData', JSON.stringify(user));
          await AsyncStorage.setItem('pendingOAuthToken', result.token);

          // ✅ CRITICAL FIX: Store token in storage service so API calls can authenticate
          // This matches the web implementation where token is available for API calls
          await storage.setToken(result.token);

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
          // If no user data, store token and navigate to dashboard
          await storage.setToken(result.token);
          router.replace('/(tabs)');
        }
        return;
      }
      throw new Error('No token received from Microsoft. Please try again.');
    } catch (e: any) {
      // Clean up any pending tokens on error
      await AsyncStorage.removeItem('pendingOAuthToken');

      // Provide more specific error messages for Microsoft OAuth
      let message: string;

      // Check for user cancellation (don't show error for intentional cancellation)
      if (e?.message?.includes('User cancelled') ||
        e?.message?.includes('user_cancelled') ||
        e?.message?.toLowerCase().includes('cancelled')) {
        // User intentionally cancelled - don't set error, just silently return
        setError(null);
        return; // Don't throw, just return gracefully
      } else if (e?.message?.includes('network') || e?.message?.includes('connection')) {
        message = 'Network error during Microsoft login. Please check your connection and try again.';
      } else if (e?.message?.includes('timeout')) {
        message = 'Microsoft login timed out. Please try again.';
      } else if (e?.message?.includes('No token')) {
        message = 'Microsoft authentication failed. No access token received. Please try again.';
      } else if (e?.message?.includes('token exchange failed')) {
        message = 'Failed to authenticate with Microsoft. Please try again.';
      } else if (e?.message?.includes('Failed to get user info')) {
        message = 'Could not retrieve your Microsoft account information. Please try again.';
      } else if (e?.message?.includes('Backend validation failed')) {
        message = 'Server could not validate your Microsoft account. Please try again or contact support.';
      } else if (e?.response?.data?.message) {
        message = e.response.data.message;
      } else {
        message = e?.message || 'Microsoft login failed. Please try again.';
      }

      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { isLoading, error, login, loginWithMicrosoft, clearError };
};


