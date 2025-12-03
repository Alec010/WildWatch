// Hook for fetching user ranking summary
import { useState, useEffect, useCallback } from 'react';
import { rankingAPI } from '../api/ranking_api';
import type { UserRankingSummary, RankProgress } from '../models/RankingModels';

interface UseRankingSummaryOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
  includeSummary?: boolean;
}

interface UseRankingSummaryReturn {
  rankingSummary: UserRankingSummary | null;
  rankProgress: RankProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRankingSummary = (options: UseRankingSummaryOptions = {}): UseRankingSummaryReturn => {
  const { 
    autoFetch = true, 
    refreshInterval = 30000, // 30 seconds default refresh
    includeSummary = false 
  } = options;
  
  const [rankingSummary, setRankingSummary] = useState<UserRankingSummary | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankingSummary = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Always get real-time rank data
      const rankData = await rankingAPI.getMyRank();
      setRankProgress(rankData);
      
      // Get full summary only if needed
      if (includeSummary) {
        const summaryData = await rankingAPI.getUserRankingSummary();
        setRankingSummary(summaryData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ranking data';
      setError(errorMessage);
      console.error('Ranking fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeSummary]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchRankingSummary();
    }
  }, [autoFetch, fetchRankingSummary]);

  // Set up periodic refresh
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(fetchRankingSummary, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchRankingSummary]);

  return {
    rankingSummary,
    rankProgress,
    isLoading,
    error,
    refetch: fetchRankingSummary,
  };
};
