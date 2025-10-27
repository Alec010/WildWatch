/**
 * Types and interfaces for the ranking system
 */

export type UserRank = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'

export interface RankProgress {
  currentRank: UserRank
  currentPoints: number
  nextRank: UserRank | null
  pointsToNextRank: number
  progressPercentage: number
  goldRanking?: number // 1-10 for Gold Elite
  rankDisplayName: string
}

export interface GoldEliteEntry {
  id: number
  name: string
  points: number
  goldRanking: number
  averageRating: number
  totalIncidents: number
}

export interface LeaderboardEntryWithRank {
  id: number
  name: string
  totalRatings?: number
  totalIncidents?: number
  averageRating: number
  points: number
  rank: UserRank
  goldRanking?: number
  activeIncidents?: number
  resolvedIncidents?: number
}

// Rank thresholds
export const RANK_THRESHOLDS = {
  BRONZE: 100,
  SILVER: 200,
  GOLD: 300,
} as const

// Rank colors
export const RANK_COLORS = {
  NONE: '#9CA3AF',
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
} as const

// Rank gradient colors
export const RANK_GRADIENTS = {
  NONE: 'from-gray-400 to-gray-500',
  BRONZE: 'from-amber-600 to-amber-700',
  SILVER: 'from-gray-300 to-gray-400',
  GOLD: 'from-yellow-400 to-yellow-500',
} as const

// Rank names
export const RANK_NAMES = {
  NONE: 'Unranked',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
} as const

// Rank icons (emoji fallback)
export const RANK_ICONS = {
  NONE: '⚪',
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
} as const








