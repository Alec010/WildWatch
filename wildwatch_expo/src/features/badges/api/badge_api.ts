/**
 * API service for badge-related operations
 */

import { config } from '../../../../lib/config';
import { storage } from '../../../../lib/storage';
import type { BadgeProgress, UserBadgeSummary } from '../models/BadgeModels';

const API_BASE_URL = config.API.BASE_URL;
const API_TIMEOUT = config.API.TIMEOUT;

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await storage.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
}

export const badgeAPI = {
  /**
   * Get all badges with progress for the authenticated user
   */
  getUserBadges: async (): Promise<BadgeProgress[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/badges`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch user badges');
      }

      const data: BadgeProgress[] = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get badge summary for the authenticated user
   */
  getUserBadgeSummary: async (): Promise<UserBadgeSummary> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/badges/summary`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch user badge summary');
      }

      const data: UserBadgeSummary = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Claim a badge (mark as claimed and award points)
   */
  claimBadge: async (badgeId: number): Promise<void> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/badges/claim/${badgeId}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to claim badge');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get badge icon URL (helper to construct full URL if needed)
   */
  getBadgeIconUrl: (badge: BadgeProgress): string => {
    if (badge.iconUrl && badge.iconUrl.startsWith('/')) {
      return `${API_BASE_URL}${badge.iconUrl}`;
    }
    return badge.iconUrl || '';
  },
};

