import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDisplay } from './BadgeDisplay';
import type { UserBadgeSummary, BadgeProgress } from '../models/BadgeModels';

interface BadgePreviewProps {
  badgeSummary: UserBadgeSummary | null;
  recentBadges: BadgeProgress[];
  onViewAll: () => void;
}

export function BadgePreview({ 
  badgeSummary, 
  recentBadges, 
  onViewAll 
}: BadgePreviewProps) {
  if (!badgeSummary || recentBadges.length === 0) {
    return null;
  }

  const remainingCount = badgeSummary.totalBadgesEarned - recentBadges.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={16} color="#D97706" />
          <Text style={styles.headerTitle}>Your Badges</Text>
        </View>
        <Text style={styles.headerCount}>
          {badgeSummary.totalBadgesEarned}/{badgeSummary.totalBadgesAvailable} earned
        </Text>
      </View>

      {/* Badge List */}
      <View style={styles.badgeList}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {recentBadges.map((badge) => (
            <View key={badge.badgeId} style={styles.badgeItem}>
              <BadgeDisplay 
                badge={badge}
                size="md"
                showLevel={true}
                showName={false}
              />
            </View>
          ))}

          {/* View More Button */}
          {remainingCount > 0 && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={onViewAll}
            >
              <Text style={styles.moreButtonText}>
                +{remainingCount} more
              </Text>
            </TouchableOpacity>
          )}

          {/* View All Button */}
          {remainingCount === 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={onViewAll}
            >
              <Ionicons name="grid" size={16} color="#D97706" />
              <Text style={styles.viewAllButtonText}>
                View All
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={12} color="#D97706" />
          <Text style={styles.statText}>
            {badgeSummary.totalBadgesEarned} badges
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="gift" size={12} color="#10B981" />
          <Text style={styles.statText}>
            +{badgeSummary.totalPointsEarned} points
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  headerCount: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  badgeList: {
    marginBottom: 12,
  },
  scrollContent: {
    gap: 16,
    paddingRight: 16,
  },
  badgeItem: {
    alignItems: 'center',
  },
  moreButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    minWidth: 80,
  },
  moreButtonText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  viewAllButtonText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#FDE68A',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
});

