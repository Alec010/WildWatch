// Hook for fetching user ranking summary
import { useState, useEffect } from 'react';
import { rankingAPI } from '../api/ranking_api';
import type { UserRankingSummary, RankProgress } from '../models/RankingModels';

interface UseRankingSummaryOptions {
  autoFetch?: boolean;
}

interface UseRankingSummaryReturn {
  rankingSummary: UserRankingSummary | null;
  rankProgress: RankProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRankingSummary = (options: UseRankingSummaryOptions = {}): UseRankingSummaryReturn => {
  const { autoFetch = true } = options;
  
  const [rankingSummary, setRankingSummary] = useState<UserRankingSummary | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankingSummary = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await rankingAPI.getUserRankingSummary();
      setRankingSummary(data);
      setRankProgress(data.rankProgress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ranking summary';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchRankingSummary();
    }
  }, [autoFetch]);

  return {
    rankingSummary,
    rankProgress,
    isLoading,
    error,
    refetch: fetchRankingSummary,
  };
};
