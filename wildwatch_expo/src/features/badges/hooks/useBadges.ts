import { useState, useEffect, useCallback } from 'react';
import { badgeAPI } from '../api/badge_api';
import type { BadgeProgress } from '../models/BadgeModels';

interface UseBadgesOptions {
  autoFetch?: boolean;
}

export function useBadges(options: UseBadgesOptions = {}) {
  const { autoFetch = true } = options;
  
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await badgeAPI.getUserBadges();
      setBadges(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load badges';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchBadges();
    }
  }, [autoFetch, fetchBadges]);

  return {
    badges,
    isLoading,
    error,
    refetch: fetchBadges,
  };
}

