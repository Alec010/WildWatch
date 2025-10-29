"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API_BASE_URL } from "@/utils/api";
import { api } from "@/utils/apiClient";

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
        const response = await api.get("/api/auth/profile");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else {
          // If profile fetch fails, set role to null but don't redirect
          // Let individual pages handle their own authentication logic
          setUserRole(null);
        }
      } catch (e) {
        // If there's an error, set role to null but don't redirect
        // The apiClient will handle token refresh and redirects if needed
        setUserRole(null);
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
