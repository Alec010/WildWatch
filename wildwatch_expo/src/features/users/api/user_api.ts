import { api } from '../../../../lib/api';
import type { UserSearchResponse, UserSearchRequest } from '../models/UserModels';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const userAPI = {
  searchUsers: async (params: UserSearchRequest): Promise<PaginatedResponse<UserSearchResponse>> => {
    const queryParams = new URLSearchParams({
      query: params.query,
      page: (params.page || 0).toString(),
      size: (params.size || 10).toString(),
    });
    
    const response = await api.get<PaginatedResponse<UserSearchResponse>>(`/users/search?${queryParams}`);
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (payload: any): Promise<any> => {
    const response = await api.put('/users/me', payload);
    return response.data;
  },
};