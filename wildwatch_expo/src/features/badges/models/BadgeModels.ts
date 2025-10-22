/**
 * Badge System Models and Types
 * Defines all interfaces, types, and constants for the badge feature
 */

export type BadgeType = 
  | 'FIRST_RESPONDER' 
  | 'COMMUNITY_HELPER' 
  | 'CAMPUS_LEGEND' 
  | 'FIRST_RESPONSE' 
  | 'RATING_CHAMPION' 
  | 'OFFICE_LEGEND';

export interface BadgeLevel {
  level: number;
  description: string;
  requirement: number;
  achieved: boolean;
  awardedDate: string | null;
}

export interface BadgeProgress {
  badgeId: number;
  name: string;
  description: string;
  iconUrl: string;
  pointReward: number;
  badgeType: BadgeType;
  currentLevel: number;
  currentProgress: number;
  nextLevelRequirement: number;
  progressPercentage: number;
  levels: BadgeLevel[];
  isCompleted: boolean;
  pointsAwarded: boolean;
}

export interface UserBadgeSummary {
  totalBadgesEarned: number;
  totalBadgesAvailable: number;
  totalPointsEarned: number;
  badges: BadgeProgress[];
}

// Badge colors based on type (adapted for React Native)
export const BADGE_COLORS = {
  // Regular user badges
  FIRST_RESPONDER: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    background: '#EFF6FF',
    border: '#BFDBFE',
  },
  COMMUNITY_HELPER: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    background: '#ECFDF5',
    border: '#A7F3D0',
  },
  CAMPUS_LEGEND: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    background: '#FFFBEB',
    border: '#FDE68A',
  },
  // Office admin badges
  FIRST_RESPONSE: {
    primary: '#8B0000',
    secondary: '#DC143C',
    background: '#FFF5F5',
    border: '#FECACA',
  },
  RATING_CHAMPION: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    background: '#FAF5FF',
    border: '#E9D5FF',
  },
  OFFICE_LEGEND: {
    primary: '#D97706',
    secondary: '#FBBF24',
    background: '#FFFBEB',
    border: '#FDE68A',
  },
};

// Badge icons (using Ionicons icon names)
export const BADGE_ICONS = {
  // Regular user badges
  FIRST_RESPONDER: 'alert-circle',
  COMMUNITY_HELPER: 'people',
  CAMPUS_LEGEND: 'trophy',
  // Office admin badges
  FIRST_RESPONSE: 'flash',
  RATING_CHAMPION: 'star',
  OFFICE_LEGEND: 'ribbon',
};

// Badge display names
export const BADGE_NAMES = {
  // Regular user badges
  FIRST_RESPONDER: 'First Responder',
  COMMUNITY_HELPER: 'Community Helper',
  CAMPUS_LEGEND: 'Campus Legend',
  // Office admin badges
  FIRST_RESPONSE: 'First Response',
  RATING_CHAMPION: 'Rating Champion',
  OFFICE_LEGEND: 'Office Legend',
};

// Badge descriptions
export const BADGE_DESCRIPTIONS = {
  // Regular user badges
  FIRST_RESPONDER: 'Submit your very first incident report',
  COMMUNITY_HELPER: 'Receive upvotes on your incident reports',
  CAMPUS_LEGEND: 'Achieve and maintain Gold rank',
  // Office admin badges
  FIRST_RESPONSE: 'Resolve incident reports',
  RATING_CHAMPION: 'Receive high ratings from students',
  OFFICE_LEGEND: 'Achieve and maintain Gold rank',
};

