/**
 * API service for rank-related operations
 */

import { API_BASE_URL } from './api'
import { RankProgress, GoldEliteEntry, UserRank, RANK_COLORS, RANK_THRESHOLDS } from '@/types/rank'

export const rankService = {
  /**
   * Get authenticated user's rank progress
   */
  getMyRank: async (): Promise<RankProgress> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/ranks/my-rank`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch rank progress')
    }

    return response.json()
  },

  /**
   * Get specific user's rank progress
   */
  getUserRank: async (userId: number): Promise<RankProgress> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/ranks/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user rank')
    }

    return response.json()
  },

  /**
   * Get Gold Elite leaderboard for users
   */
  getGoldEliteUsers: async (): Promise<GoldEliteEntry[]> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/ranks/gold-elite/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Gold Elite users')
    }

    return response.json()
  },

  /**
   * Get Gold Elite leaderboard for offices
   */
  getGoldEliteOffices: async (): Promise<GoldEliteEntry[]> => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/ranks/gold-elite/offices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Gold Elite offices')
    }

    return response.json()
  },

  /**
   * Calculate rank from points (client-side utility)
   */
  calculateRankFromPoints: (points: number): UserRank => {
    if (points >= RANK_THRESHOLDS.GOLD) return 'GOLD'
    if (points >= RANK_THRESHOLDS.SILVER) return 'SILVER'
    if (points >= RANK_THRESHOLDS.BRONZE) return 'BRONZE'
    return 'NONE'
  },

  /**
   * Get rank color
   */
  getRankColor: (rank: UserRank): string => {
    return RANK_COLORS[rank]
  },

  /**
   * Get points required for next rank
   */
  getPointsToNextRank: (currentPoints: number, currentRank: UserRank): number => {
    if (currentRank === 'GOLD') return 0 // Already at max rank
    if (currentRank === 'SILVER') return RANK_THRESHOLDS.GOLD - currentPoints
    if (currentRank === 'BRONZE') return RANK_THRESHOLDS.SILVER - currentPoints
    return RANK_THRESHOLDS.BRONZE - currentPoints
  },

  /**
   * Get progress percentage to next rank
   */
  getProgressPercentage: (currentPoints: number, currentRank: UserRank): number => {
    if (currentRank === 'GOLD') return 100

    let currentThreshold = 0
    let nextThreshold = RANK_THRESHOLDS.BRONZE

    if (currentRank === 'BRONZE') {
      currentThreshold = RANK_THRESHOLDS.BRONZE
      nextThreshold = RANK_THRESHOLDS.SILVER
    } else if (currentRank === 'SILVER') {
      currentThreshold = RANK_THRESHOLDS.SILVER
      nextThreshold = RANK_THRESHOLDS.GOLD
    }

    const range = nextThreshold - currentThreshold
    const progress = currentPoints - currentThreshold
    return Math.min(100, (progress / range) * 100)
  },
}

