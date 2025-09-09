import { api } from '../../../../lib/api';

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  schoolIdNumber: string;
  contactNumber: string;
  role: string;
};
export type UserUpdateRequest = {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  contactNumber?: string;
};

export const userAPI = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/profile');
    return response.data;
  },
  updateMe: async (payload: UserUpdateRequest): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/me', payload);
    return response.data;
  },
};


