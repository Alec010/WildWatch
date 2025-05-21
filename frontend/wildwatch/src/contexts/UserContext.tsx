"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/utils/api";

interface UserContextType {
  userRole: string | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  userRole: null,
  isLoading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];
        if (!token) {
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ userRole, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext); 