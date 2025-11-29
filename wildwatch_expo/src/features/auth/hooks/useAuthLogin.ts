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
      let message: string;
      
      // Check for network/server errors
      // Axios errors: e.response exists if server responded, e.request exists if request was made but no response
      if (!e.response) {
        // No response means network error or server is down
        if (e.code === 'ECONNABORTED' || e.message?.includes('timeout') || e.message?.includes('Timeout')) {
          message = 'Request timed out. The server may be slow or unavailable. Please try again.';
        } else if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || 
                   e.message?.includes('Network Error') || e.message?.includes('network')) {
          message = 'Unable to connect to the server. Please check your internet connection or try again later.';
        } else if (e.message?.includes('Failed to fetch') || e.message?.includes('Network request failed') ||
                   e.message?.includes('fetch')) {
          message = 'Network error. Please check your internet connection and try again.';
        } else if (e.request && !e.response) {
          // Request was made but no response received (server is down)
          message = 'Server is currently unavailable. Please try again later.';
        } else {
          message = 'Unable to reach the server. Please check your connection and try again.';
        }
      } else if (e.response.status >= 500) {
        // Server errors (500, 502, 503, 504)
        if (e.response.status === 503) {
          message = 'Service temporarily unavailable. The server is down for maintenance. Please try again later.';
        } else if (e.response.status === 504) {
          message = 'Gateway timeout. The server took too long to respond. Please try again.';
        } else if (e.response.status === 502) {
          message = 'Bad gateway. The server is temporarily unavailable. Please try again later.';
        } else {
          message = 'Server error occurred. Please try again later.';
        }
      } else {
        // Client errors (400, 401, 404, etc.) - use backend message or default
        message = e.response?.data?.message || e.message || 'Login failed. Please check your credentials and try again.';
      }
      
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let tokenSaved = false;
    try {
      const result = await microsoftOAuthService.signInWithMicrosoft();
      if (result?.token) {
        // Check if we have user data in the response to determine routing
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
          // If no user data, save token and navigate to dashboard
          await storage.setToken(result.token);
          tokenSaved = true;
          router.replace('/(tabs)');
        }
        return;
      }
      throw new Error('No token received from Microsoft OAuth');
    } catch (e: any) {
      // If token was saved, user is authenticated - don't show error
      if (tokenSaved) {
        const savedToken = await storage.getToken();
        if (savedToken) {
          // User is authenticated, navigate to dashboard
          try {
            router.replace('/(tabs)');
          } catch (navError) {
            // Navigation error, but user is logged in - don't show error
            console.warn('Navigation error after successful auth:', navError);
          }
          return;
        }
      }
      
      // Only show error if token wasn't saved (actual authentication failure)
      let message: string;
      
      // Check for network/server errors (but not OAuth-specific errors like user cancellation)
      const isOAuthError = e.message?.includes('OAuth') || e.message?.includes('cancelled') || 
                          e.message?.includes('cancel') || e.message?.includes('User cancelled');
      
      if (!e.response && !isOAuthError) {
        // Network/server errors
        if (e.code === 'ECONNABORTED' || e.message?.includes('timeout') || e.message?.includes('Timeout')) {
          message = 'Request timed out. The server may be slow or unavailable. Please try again.';
        } else if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' ||
                   e.message?.includes('Network Error') || e.message?.includes('network')) {
          message = 'Unable to connect to the server. Please check your internet connection or try again later.';
        } else if (e.message?.includes('Failed to fetch') || e.message?.includes('Network request failed') ||
                   e.message?.includes('fetch')) {
          message = 'Network error. Please check your internet connection and try again.';
        } else if (e.request && !e.response) {
          // Request was made but no response received (server is down)
          message = 'Server is currently unavailable. Please try again later.';
        } else {
          message = 'Unable to reach the server. Please check your connection and try again.';
        }
      } else if (e.response?.status >= 500) {
        // Server errors
        if (e.response.status === 503) {
          message = 'Service temporarily unavailable. The server is down for maintenance. Please try again later.';
        } else if (e.response.status === 504) {
          message = 'Gateway timeout. The server took too long to respond. Please try again.';
        } else if (e.response.status === 502) {
          message = 'Bad gateway. The server is temporarily unavailable. Please try again later.';
        } else {
          message = 'Server error occurred. Please try again later.';
        }
      } else {
        // OAuth or other errors
        message = e?.message || 'Microsoft login failed. Please try again.';
      }
      
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, login, loginWithMicrosoft };
};


