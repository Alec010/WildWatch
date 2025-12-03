import type { UserRank } from '../../ranking/models/RankingModels';

export interface LeaderboardEntry {
  id: number;
  name: string;
  totalIncidents?: number;
  averageRating?: number;
  points?: number;
  activeIncidents?: number;
  resolvedIncidents?: number;
  rank?: UserRank;           // User rank (BRONZE/SILVER/GOLD)
  goldRanking?: number;      // Gold Elite ranking (1-10)
}

export interface RatingRequest {
  honesty: number;
  credibility: number;
  responsiveness: number;
  helpfulness: number;
  feedback?: string;
}

export interface RatingDimension {
  honesty: number;
  credibility: number;
  responsiveness: number;
  helpfulness: number;
  feedback?: string;
  totalPoints: number;
  averageRating: number;
}

export interface IncidentRatingResponse {
  incidentId: string;
  reporterRating?: RatingDimension;
  officeRating?: RatingDimension;
  pointsAwarded: boolean;
  totalReporterPoints: number;
  totalOfficePoints: number;
}

export interface RatingStatus {
  reporterRating?: RatingDimension;
  officeRating?: RatingDimension;
  pointsAwarded: boolean;
  totalReporterPoints: number;
  totalOfficePoints: number;
}

export const RATING_DIMENSIONS = {
  reporter: {
    honesty: "Honesty",
    credibility: "Credibility", 
    responsiveness: "Responsiveness",
    helpfulness: "Helpfulness"
  },
  office: {
    honesty: "Honesty",
    credibility: "Credibility",
    responsiveness: "Responsiveness", 
    helpfulness: "Helpfulness"
  }
} as const;