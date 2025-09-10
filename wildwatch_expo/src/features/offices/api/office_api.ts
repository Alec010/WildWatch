import { api } from '../../../../lib/api';
import type { OfficeInfoDto } from '../../offices/models/OfficeModels';

export const officeAPI = {
  getOffices: async (): Promise<OfficeInfoDto[]> => {
    const response = await api.get<OfficeInfoDto[]>('/offices');
    return response.data;
  },
};


