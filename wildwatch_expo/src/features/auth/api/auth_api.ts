import { api } from '../../../../lib/api';

export type LoginRequestDto = { email: string; password: string };
export type RegisterRequestDto = {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  schoolIdNumber: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  termsAccepted: boolean;
};
export type AuthResponseDto = { token: string; message?: string };

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/auth/login', { email, password } satisfies LoginRequestDto);
    return response.data;
  },
  register: async (userData: RegisterRequestDto): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/mobile/auth/profile');
    return response.data;
  },
  acceptTerms: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/terms/accept');
    return response.data;
  },
  setupOAuthUser: async (contactNumber: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/mobile/auth/setup', {
      contactNumber,
      password,
    });
    return response.data;
  },
  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>('/auth/logout');
      return response.data;
    } catch (error) {
      // Even if backend logout fails, we still want to clear local data
      console.warn('Backend logout failed, but continuing with local cleanup');
      throw error;
    }
  },
};


