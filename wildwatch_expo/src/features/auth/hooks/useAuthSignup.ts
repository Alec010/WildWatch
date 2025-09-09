import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { authAPI, type RegisterRequestDto } from '../../auth/api/auth_api';
import { storage } from '../../../../lib/storage';

export const useAuthSignup = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (payload: RegisterRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(payload);
      await storage.setToken(res.token);
      router.replace('/(tabs)');
    } catch (e: any) {
      const message: string = e?.response?.data?.message || e?.message || 'Registration failed. Please try again.';
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, register };
};


