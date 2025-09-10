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
    const response = await api.get('/auth/profile');
    return response.data;
  },
};


