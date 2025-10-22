// Badge preview component showing recent badges with mobile-optimized design
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BadgeProgress } from '../../badges/models/BadgeModels';
import type { UserBadgeSummary } from '../../badges/models/BadgeModels';

interface BadgePreviewProps {
  badgeSummary: UserBadgeSummary;
  recentBadges: BadgeProgress[];
  onViewAll: () => void;
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({
  badgeSummary,
  recentBadges,
  onViewAll
}) => {
  const earnedCount = badgeSummary.totalBadgesEarned;
  const totalCount = badgeSummary.totalBadgesAvailable;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trophy" size={20} color="#D97706" />
          <Text style={styles.title}>Your Badges</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {earnedCount}/{totalCount} earned
          </Text>
        </View>
      </View>

      {recentBadges.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesScrollContent}
        >
          {recentBadges.map((badge) => (
            <View key={badge.badgeId} style={styles.badgeCard}>
              <View style={[styles.badgeIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons 
                  name="trophy" 
                  size={24} 
                  color="#3B82F6" 
                />
                <View style={[styles.levelBadge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.levelText}>{badge.currentLevel}</Text>
                </View>
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeLevel}>Level {badge.currentLevel}</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewAllCard} onPress={onViewAll}>
            <View style={styles.viewAllContent}>
              <Ionicons name="chevron-forward" size={24} color="#D97706" />
              <Text style={styles.viewAllText}>View All</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No badges yet</Text>
          <Text style={styles.emptySubtitle}>
            Start contributing to earn your first badge!
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={onViewAll}>
            <Text style={styles.ctaButtonText}>Explore Badges</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  statsContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  badgesScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  badgeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeLevel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  viewAllCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
  },
  viewAllContent: {
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
