'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/utils/api';

interface User {
  firstName: string;
  lastName: string;
  schoolIdNumber: string;
  email: string;
  role: string;
  officeCode?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    const token = Cookies.get('token');
    if (!token) {
      clearUser();
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          clearUser();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      setUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        schoolIdNumber: userData.schoolIdNumber,
        email: userData.email,
        role: userData.role,
        officeCode: userData.officeCode
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      clearUser();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, clearUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ user, loading, error, refetchUser: fetchUserProfile, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 