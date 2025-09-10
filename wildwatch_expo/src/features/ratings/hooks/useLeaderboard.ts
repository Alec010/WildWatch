import { useCallback, useEffect, useState } from 'react';
import { ratingAPI } from '../../ratings/api/rating_api';
import type { LeaderboardEntry } from '../../ratings/models/RatingModels';

export const useLeaderboard = () => {
  const [topReporters, setTopReporters] = useState<LeaderboardEntry[]>([]);
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reporters, offices] = await Promise.all([
        ratingAPI.getTopReporters(),
        ratingAPI.getTopOffices(),
      ]);
      setTopReporters(reporters);
      setTopOffices(offices);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLeaderboard(); }, [fetchLeaderboard]);

  return { topReporters, topOffices, isLoading, error, refresh: fetchLeaderboard };
};


