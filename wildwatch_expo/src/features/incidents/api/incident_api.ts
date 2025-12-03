import { api } from '../../../../lib/api';
import type { IncidentRequestDto, IncidentResponseDto } from '../../incidents/models/IncidentModels';

export const incidentAPI = {
  createIncident: async (payload: IncidentRequestDto, files?: { uri: string; name: string; type: string; }[]): Promise<IncidentResponseDto> => {
    const form = new FormData();
    form.append('incidentData', JSON.stringify(payload));
    (files || []).forEach((file) => {
      form.append('files', {
        uri: file.uri as any,
        name: file.name,
        type: file.type,
      } as any);
    });
    const response = await api.post<IncidentResponseDto>('/incidents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getMyIncidents: async (): Promise<IncidentResponseDto[]> => {
    const response = await api.get<IncidentResponseDto[]>('/incidents/my-incidents');
    return response.data;
  },
  getPublicIncidents: async (): Promise<IncidentResponseDto[]> => {
    const response = await api.get<IncidentResponseDto[]>('/incidents/public');
    return response.data;
  },
  getByTrackingNumber: async (trackingNumber: string): Promise<IncidentResponseDto> => {
    const response = await api.get<IncidentResponseDto>(`/incidents/track/${encodeURIComponent(trackingNumber)}`);
    return response.data;
  },
  getUpvoteStatus: async (incidentId: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/incidents/${incidentId}/upvote-status`);
    return response.data;
  },
};


