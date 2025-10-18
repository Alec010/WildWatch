import { api } from '../../../../lib/api';
import type { OfficeBulletinDto } from '../models/BulletinModels';

export const bulletinAPI = {
  getAllBulletins: async (): Promise<OfficeBulletinDto[]> => {
    const response = await api.get<OfficeBulletinDto[]>('/office-bulletins');
    return response.data;
  },
};

