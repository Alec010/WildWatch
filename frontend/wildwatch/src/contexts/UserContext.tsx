"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/utils/api";
import { api } from "@/utils/apiClient";
import Cookies from "js-cookie";

interface UserContextType {
  userRole: string | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userRole: null,
  isLoading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchUserProfileRef = useRef<(() => Promise<void>) | null>(null);

  const fetchUserProfile = useCallback(async () => {
    const token = Cookies.get('token');
    
    // If no token, reset state
    if (!token) {
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      } else {
        // If unauthorized, clear the role
        setUserRole(null);
      }
    } catch (e) {
      // On error, clear the role
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Store the latest fetchUserProfile in a ref
  fetchUserProfileRef.current = fetchUserProfile;

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Listen for token changes via custom events
  useEffect(() => {
    const handleTokenChange = () => {
      const token = Cookies.get('token');
      
      // If token was removed (logout), reset state immediately
      if (!token) {
        setUserRole(null);
        setIsLoading(false);
      }
      // If token exists, always refetch to get the latest user role
      else if (token && fetchUserProfileRef.current) {
        fetchUserProfileRef.current();
      }
    };

    // Listen for custom token change events (dispatched by tokenService)
    window.addEventListener('token-changed', handleTokenChange);

    return () => {
      window.removeEventListener('token-changed', handleTokenChange);
    };
  }, []); // Empty deps - we use ref to access latest function

  const refreshUser = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ userRole, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext); 