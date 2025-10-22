// Main ranking dashboard component that combines all ranking elements
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { RankingHeader } from './RankingHeader';
import { RankProgress } from './RankProgress';
import { RankTiers } from './RankTiers';
import { BadgePreview } from './BadgePreview';
import type { UserRankingSummary, RankProgress as RankProgressType } from '../models/RankingModels';
import { RANK_TIERS } from '../models/RankingModels';
import type { BadgeProgress, UserBadgeSummary } from '../../badges/models/BadgeModels';

interface RankingDashboardProps {
  rankingSummary: UserRankingSummary | null;
  rankProgress: RankProgressType | null;
  badgeSummary: UserBadgeSummary | null;
  recentBadges: BadgeProgress[];
  isLoading: boolean;
  onViewBadges: () => void;
  onClaimBadge: (badgeId: number) => Promise<void>;
}

export const RankingDashboard: React.FC<RankingDashboardProps> = ({
  rankingSummary,
  rankProgress,
  badgeSummary,
  recentBadges,
  isLoading,
  onViewBadges,
  onClaimBadge
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (!rankProgress) {
    return null;
  }

  const newBadgeCount = 0; // TODO: Add isNew property to BadgeProgress if needed

  return (
    <View style={styles.container}>
      <RankingHeader 
        onViewBadges={onViewBadges}
        newBadgeCount={newBadgeCount}
      />
      
      <RankProgress rankProgress={rankProgress} />
      
      <RankTiers 
        currentRank={rankProgress.currentRank}
        tiers={RANK_TIERS}
      />
      
      {badgeSummary && (
        <BadgePreview
          badgeSummary={badgeSummary}
          recentBadges={recentBadges}
          onViewAll={onViewBadges}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
