import Cookies from 'js-cookie';
import { API_BASE_URL } from "./api";

interface AuthResponse {
  isAuthenticated: boolean;
  user: {
    role: string;
    termsAccepted: boolean;
    [key: string]: any;
  } | null;
}

export const checkAuth = async (): Promise<AuthResponse> => {
  console.log('Starting authentication check...');
  try {
    console.log('Making request to /api/auth/profile...');
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });

    console.log('Profile response status:', response.status);

    if (!response.ok) {
      console.log('Authentication failed - response not OK');
      throw new Error('Not authenticated');
    }

    const data = await response.json();
    console.log('Authentication successful, user data:', data);
    
    return { isAuthenticated: true, user: data };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { isAuthenticated: false, user: null };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const logout = async () => {
  const tokenService = (await import('./tokenService')).default;
  tokenService.removeToken();
  window.location.href = '/login';
};

export const handleAuthRedirect = (user: { role: string; termsAccepted: boolean }) => {
  if (!user.termsAccepted) {
    return '/terms';
  }

  switch (user.role) {
    case 'OFFICE_ADMIN':
      return '/office-admin/dashboard';
    case 'SYSTEM_ADMIN':
      return '/admin/dashboard';
    case 'REGULAR_USER':
    default:
      return '/dashboard';
  }
}; 