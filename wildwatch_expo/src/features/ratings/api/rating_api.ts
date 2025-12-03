import { api } from '../../../../lib/api';
import type { LeaderboardEntry, RatingRequest, IncidentRatingResponse } from '../models/RatingModels';
import type { GoldEliteEntry } from '../../ranking/models/RankingModels';

export const ratingAPI = {
  getTopReporters: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>('/ratings/leaderboard/reporters/top');
    return res.data;
  },
  getTopOffices: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>('/ratings/leaderboard/offices/top');
    return res.data;
  },
  getGoldEliteUsers: async (): Promise<GoldEliteEntry[]> => {
    const res = await api.get<GoldEliteEntry[]>('/ranks/gold-elite/users');
    return res.data;
  },
  getGoldEliteOffices: async (): Promise<GoldEliteEntry[]> => {
    const res = await api.get<GoldEliteEntry[]>('/ranks/gold-elite/offices');
    return res.data;
  },
  getIncidentRating: async (incidentId: string): Promise<IncidentRatingResponse> => {
    const res = await api.get<IncidentRatingResponse>(`/ratings/incidents/${incidentId}`);
    return res.data;
  },
  rateReporter: async (incidentId: string, rating: RatingRequest): Promise<IncidentRatingResponse> => {
    const res = await api.post<IncidentRatingResponse>(`/ratings/incidents/${incidentId}/reporter`, rating);
    return res.data;
  },
  rateOffice: async (incidentId: string, rating: RatingRequest): Promise<IncidentRatingResponse> => {
    const res = await api.post<IncidentRatingResponse>(`/ratings/incidents/${incidentId}/office`, rating);
    return res.data;
  },
};


