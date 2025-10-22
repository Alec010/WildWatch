// Rank tiers component showing all available rank tiers
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserRank, RankTier } from '../models/RankingModels';
import { RANK_COLORS, RANK_ICONS, RANK_NAMES } from '../models/RankingModels';

interface RankTiersProps {
  currentRank: UserRank;
  tiers: RankTier[];
}

export const RankTiers: React.FC<RankTiersProps> = ({ currentRank, tiers }) => {

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tiers.map((tier) => {
          const isCurrentTier = tier.name === currentRank;
          const isUnlocked = currentRank !== 'NONE' || tier.name === 'NONE';
          
          return (
            <View 
              key={tier.id} 
              style={[
                styles.tierCard,
                isCurrentTier && styles.currentTierCard,
                !isUnlocked && styles.lockedTierCard
              ]}
            >
              <View style={[
                styles.tierIconContainer,
                { backgroundColor: isUnlocked ? RANK_COLORS[tier.name as UserRank] + '20' : '#F3F4F6' }
              ]}>
                <Ionicons 
                  name={RANK_ICONS[tier.name as UserRank] as any} 
                  size={24} 
                  color={isUnlocked ? RANK_COLORS[tier.name as UserRank] : '#9CA3AF'} 
                />
              </View>
              <Text style={[
                styles.tierName,
                { color: isUnlocked ? RANK_COLORS[tier.name as UserRank] : '#9CA3AF' }
              ]}>
                {tier.displayName}
              </Text>
              <Text style={[
                styles.tierPoints,
                { color: isUnlocked ? '#6B7280' : '#9CA3AF' }
              ]}>
                {tier.pointsRequired} pts
              </Text>
              {isCurrentTier && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  tierCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  currentTierCard: {
    borderWidth: 2,
    borderColor: '#8B0000',
    backgroundColor: '#8B00001A',
  },
  lockedTierCard: {
    opacity: 0.6,
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  tierPoints: {
    fontSize: 12,
    textAlign: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
});
