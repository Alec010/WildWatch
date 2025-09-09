import { useCallback, useState } from 'react';
import { router } from 'expo-router';
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
        router.replace('/(tabs)');
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


