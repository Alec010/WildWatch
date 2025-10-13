/**
 * API service for badge-related operations
 */

import { API_BASE_URL } from './api';
import { BadgeProgress, UserBadgeSummary } from '@/types/badge';

export const badgeService = {
  /**
   * Get all badges with progress for the authenticated user
   */
  getUserBadges: async (): Promise<BadgeProgress[]> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/badges`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user badges');
    }

    return response.json();
  },

  /**
   * Get badge summary for the authenticated user
   */
  getUserBadgeSummary: async (): Promise<UserBadgeSummary> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/badges/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user badge summary');
    }

    return response.json();
  },

  /**
   * Get badge icon URL (fallback to emoji if URL is not available)
   */
  getBadgeIconUrl: (badge: BadgeProgress): string => {
    if (badge.iconUrl && badge.iconUrl.startsWith('/')) {
      return `${API_BASE_URL}${badge.iconUrl}`;
    }
    return badge.iconUrl || '';
  },

  /**
   * Format date string for display
   */
  formatAwardedDate: (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Claim a badge (mark as claimed)
   */
  claimBadge: async (badgeId: number): Promise<void> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/badges/claim/${badgeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to claim badge');
    }
  },
};
