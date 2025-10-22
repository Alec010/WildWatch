// Ranking system models for WildWatch mobile app
// Defines user ranking, tiers, and progress tracking
// Matches frontend structure from frontend/wildwatch/src/types/rank.ts

export type UserRank = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface RankProgress {
  currentRank: UserRank;
  currentPoints: number;
  nextRank: UserRank | null;
  pointsToNextRank: number;
  progressPercentage: number;
  goldRanking?: number; // 1-10 for Gold Elite
  rankDisplayName: string;
}

export interface GoldEliteEntry {
  id: number;
  name: string;
  points: number;
  goldRanking: number;
  averageRating: number;
  totalIncidents: number;
}

export interface LeaderboardEntryWithRank {
  id: number;
  name: string;
  totalRatings?: number;
  totalIncidents?: number;
  averageRating: number;
  points: number;
  rank: UserRank;
  goldRanking?: number;
  activeIncidents?: number;
  resolvedIncidents?: number;
}

// Legacy interface for backward compatibility
export interface UserRankingSummary {
  rankProgress: RankProgress;
  recentActivity: string[];
}

// Rank thresholds (matches frontend)
export const RANK_THRESHOLDS = {
  BRONZE: 100,
  SILVER: 200,
  GOLD: 300,
};

// Rank colors (matches frontend)
export const RANK_COLORS = {
  NONE: '#9CA3AF',
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
} as const;

// Rank names (matches frontend)
export const RANK_NAMES = {
  NONE: 'Unranked',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
} as const;

// Rank icons for React Native (Ionicons)
export const RANK_ICONS = {
  NONE: 'shield-outline',
  BRONZE: 'medal',
  SILVER: 'trophy',
  GOLD: 'crown',
} as const;

// Helper functions (matches frontend logic)
export const calculateRankFromPoints = (points: number): UserRank => {
  if (points >= RANK_THRESHOLDS.GOLD) return 'GOLD';
  if (points >= RANK_THRESHOLDS.SILVER) return 'SILVER';
  if (points >= RANK_THRESHOLDS.BRONZE) return 'BRONZE';
  return 'NONE';
};

export const getRankColor = (rank: UserRank): string => {
  return RANK_COLORS[rank];
};

export const getPointsToNextRank = (currentPoints: number, currentRank: UserRank): number => {
  if (currentRank === 'GOLD') return 0; // Already at max rank
  if (currentRank === 'SILVER') return RANK_THRESHOLDS.GOLD - currentPoints;
  if (currentRank === 'BRONZE') return RANK_THRESHOLDS.SILVER - currentPoints;
  return RANK_THRESHOLDS.BRONZE - currentPoints;
};

export const getProgressPercentage = (currentPoints: number, currentRank: UserRank): number => {
  if (currentRank === 'GOLD') return 100;

  let currentThreshold = 0;
  let nextThreshold = RANK_THRESHOLDS.BRONZE;

  if (currentRank === 'BRONZE') {
    currentThreshold = RANK_THRESHOLDS.BRONZE;
    nextThreshold = RANK_THRESHOLDS.SILVER;
  } else if (currentRank === 'SILVER') {
    currentThreshold = RANK_THRESHOLDS.SILVER;
    nextThreshold = RANK_THRESHOLDS.GOLD;
  }

  const range = nextThreshold - currentThreshold;
  const progress = currentPoints - currentThreshold;
  return Math.min(100, (progress / range) * 100);
};

// Legacy tier definitions for backward compatibility
export interface RankTier {
  id: string;
  name: string;
  displayName: string;
  pointsRequired: number;
  color: string;
  icon: string;
  description: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'none',
    name: 'NONE',
    displayName: 'Unranked',
    pointsRequired: 0,
    color: RANK_COLORS.NONE,
    icon: RANK_ICONS.NONE,
    description: 'New to WildWatch'
  },
  {
    id: 'bronze',
    name: 'BRONZE',
    displayName: 'Bronze',
    pointsRequired: RANK_THRESHOLDS.BRONZE,
    color: RANK_COLORS.BRONZE,
    icon: RANK_ICONS.BRONZE,
    description: 'First responder level'
  },
  {
    id: 'silver',
    name: 'SILVER',
    displayName: 'Silver',
    pointsRequired: RANK_THRESHOLDS.SILVER,
    color: RANK_COLORS.SILVER,
    icon: RANK_ICONS.SILVER,
    description: 'Experienced contributor'
  },
  {
    id: 'gold',
    name: 'GOLD',
    displayName: 'Gold',
    pointsRequired: RANK_THRESHOLDS.GOLD,
    color: RANK_COLORS.GOLD,
    icon: RANK_ICONS.GOLD,
    description: 'WildWatch champion'
  }
];
