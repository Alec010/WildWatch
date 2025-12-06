import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { authAPI } from '../../auth/api/auth_api';
import { storage } from '../../../../lib/storage';

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { isLoading, error, login, clearError };
};


