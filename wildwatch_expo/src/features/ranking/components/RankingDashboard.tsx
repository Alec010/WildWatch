// Main ranking dashboard component that combines all ranking elements
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
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
  onRefresh?: () => Promise<void>;  // New prop for refresh callback
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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#8B0000']} // Maroon color for refresh spinner
          tintColor="#8B0000"
        />
      }
    >
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
