import { useState, useEffect, useCallback } from 'react';
import { badgeAPI } from '../api/badge_api';
import type { UserBadgeSummary, BadgeProgress } from '../models/BadgeModels';

interface UseBadgeSummaryOptions {
  userRole?: string;
  autoFetch?: boolean;
}

export function useBadgeSummary(options: UseBadgeSummaryOptions = {}) {
  const { userRole, autoFetch = true } = options;
  
  const [badgeSummary, setBadgeSummary] = useState<UserBadgeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const filterBadgesByRole = useCallback((badges: BadgeProgress[], role?: string): BadgeProgress[] => {
    if (!role) return badges;
    
    const allowedTypes = role === 'OFFICE_ADMIN'
      ? ['FIRST_RESPONSE', 'RATING_CHAMPION', 'OFFICE_LEGEND']
      : ['FIRST_RESPONDER', 'COMMUNITY_HELPER', 'CAMPUS_LEGEND'];
    
    return badges.filter(b => allowedTypes.includes(b.badgeType));
  }, []);

  const fetchBadgeSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await badgeAPI.getUserBadgeSummary();
      
      // Filter badges by role if provided
      const filteredBadges = filterBadgesByRole(data.badges, userRole);
      
      // Recalculate summary with filtered badges
      const filteredSummary: UserBadgeSummary = {
        ...data,
        badges: filteredBadges,
        totalBadgesAvailable: filteredBadges.length,
        totalBadgesEarned: filteredBadges.filter(b => b.currentLevel > 0).length,
        totalPointsEarned: filteredBadges.reduce(
          (sum, b) => sum + (b.pointsAwarded ? b.pointReward : 0), 
          0
        ),
      };
      
      setBadgeSummary(filteredSummary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load badges';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userRole, filterBadgesByRole]);

  useEffect(() => {
    if (autoFetch) {
      fetchBadgeSummary();
    }
  }, [autoFetch, fetchBadgeSummary]);

  return {
    badgeSummary,
    isLoading,
    error,
    refetch: fetchBadgeSummary,
  };
}

