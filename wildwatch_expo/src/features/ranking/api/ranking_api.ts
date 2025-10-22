// Ranking API service for WildWatch mobile app
// Handles user ranking data and statistics

import { config } from '../../../../lib/config';
import { storage } from '../../../../lib/storage';
import type { RankProgress, UserRankingSummary } from '../models/RankingModels';

const API_BASE_URL = config.API.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await storage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for API calls with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = config.API.TIMEOUT
): Promise<Response> => {
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
    throw error;
  }
};

export const rankingAPI = {
  /**
   * Get user's rank progress (matches frontend API)
   */
  getMyRank: async (): Promise<RankProgress> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/ranks/my-rank`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch user rank progress');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's ranking summary including current rank, progress, and stats
   * @deprecated Use getMyRank() instead
   */
  getUserRankingSummary: async (): Promise<UserRankingSummary> => {
    try {
      const rankProgress = await rankingAPI.getMyRank();
      const recentActivity = await rankingAPI.getRecentActivity();
      
      return {
        rankProgress,
        recentActivity
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get leaderboard data
   */
  getLeaderboard: async (limit: number = 50): Promise<any[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/ranks/gold-elite/users?limit=${limit}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch leaderboard');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's recent activity
   */
  getRecentActivity: async (limit: number = 10): Promise<string[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/ranks/activity?limit=${limit}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch recent activity');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};
