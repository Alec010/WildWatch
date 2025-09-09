import { api } from '../../../../lib/api';
import type { LeaderboardEntry } from '../models/RatingModels';

export const ratingAPI = {
  getTopReporters: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>('/ratings/leaderboard/reporters/top');
    return res.data;
  },
  getTopOffices: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>('/ratings/leaderboard/offices/top');
    return res.data;
  },
};


