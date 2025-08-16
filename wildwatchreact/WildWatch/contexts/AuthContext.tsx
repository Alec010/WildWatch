import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  id: number; // Long in backend
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  schoolIdNumber: string;
  password: string;
  contactNumber: string;
  isEnabled: boolean;
  role: string;
  termsAccepted: boolean;
  termsAcceptedDate?: string;
  authProvider: string;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  points: number;
  resetToken?: string;
  resetTokenExpiry?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  email: string;
  schoolIdNumber: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  termsAccepted: boolean;
}

interface AuthResponse {
  token: string;
  message: string;
  termsAccepted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://192.168.1.11:8080/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwt_token');
      if (storedToken) {
        setToken(storedToken);
        // Fetch user profile
        await fetchUserProfile(storedToken);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token might be expired, clear it
        await logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      await logout();
    }
  };

  const testConnection = async () => {
    try {
      console.log('=== TESTING CONNECTION ===');
      console.log('Testing URL:', `${API_BASE_URL}/ping`);
      console.log('Current API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Ping response status:', response.status);
      console.log('Ping response ok:', response.ok);
      console.log('Ping response status text:', response.statusText);
      
      if (response.ok) {
        const pingData = await response.text();
        console.log('Ping response data:', pingData);
      }
      
      return response.ok;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      console.log('API URL:', `${API_BASE_URL}/auth/login`);
      console.log('Request body:', JSON.stringify({ email, password }));
      
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check your network connection.');
      }
      
      console.log('Connection test passed, proceeding with login...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('=== RESPONSE DETAILS ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Login failed';
        let errorData = null;
        
        try {
          errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.log('Throwing error:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Response is ok, parsing JSON...');
      const data: AuthResponse = await response.json();
      console.log('=== SUCCESS RESPONSE ===');
      console.log('Login response data:', data);
      console.log('Token received:', data.token ? 'YES' : 'NO');
      console.log('Terms accepted:', data.termsAccepted);
      console.log('Message:', data.message);
      
      if (!data.token) {
        console.error('No token received in response');
        throw new Error('No authentication token received from server');
      }
      
      // Save token to AsyncStorage
      await AsyncStorage.setItem('jwt_token', data.token);
      setToken(data.token);
      console.log('Token saved to AsyncStorage');

      // Check if terms are accepted and navigate accordingly
      if (data.termsAccepted) {
        console.log('Terms accepted, navigating to dashboard');
        router.replace('/(tabs)/dashboard');
      } else {
        console.log('Terms not accepted, staying on login');
        router.replace('/login');
      }
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      // Registration successful, navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      setToken(null);
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    testConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
