import { useState } from 'react';
import { badgeAPI } from '../api/badge_api';

export function useClaimBadge() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const claimBadge = async (badgeId: number): Promise<boolean> => {
    try {
      setIsClaiming(true);
      setClaimError(null);
      
      await badgeAPI.claimBadge(badgeId);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to claim badge';
      setClaimError(message);
      return false;
    } finally {
      setIsClaiming(false);
    }
  };

  const resetError = () => setClaimError(null);

  return {
    claimBadge,
    isClaiming,
    claimError,
    resetError,
  };
}

