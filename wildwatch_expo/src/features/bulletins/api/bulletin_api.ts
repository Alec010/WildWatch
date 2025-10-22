import { api } from '../../../../lib/api';
import type { OfficeBulletinDto } from '../models/BulletinModels';

export const bulletinAPI = {
  getAllBulletins: async (): Promise<OfficeBulletinDto[]> => {
    const response = await api.get<OfficeBulletinDto[]>('/office-bulletins');
    return response.data;
  },
  getUpvoteStatus: async (bulletinId: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/office-bulletins/${bulletinId}/upvote-status`);
    return response.data;
  },
  upvoteBulletin: async (bulletinId: string): Promise<void> => {
    await api.post(`/office-bulletins/${bulletinId}/upvote`);
  },
};

