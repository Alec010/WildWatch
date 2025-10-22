// Ranking header component with "Your Ranking" title and View Badges button
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RankingHeaderProps {
  onViewBadges: () => void;
  newBadgeCount?: number;
}

export const RankingHeader: React.FC<RankingHeaderProps> = ({
  onViewBadges,
  newBadgeCount = 0
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up" size={20} color="white" />
          </View>
          <Text style={styles.title}>Your Ranking</Text>
        </View>
        <Text style={styles.subtitle}>Track your progress and achievements.</Text>
      </View>
      
      <TouchableOpacity style={styles.badgeButton} onPress={onViewBadges}>
        <View style={styles.badgeButtonContent}>
          <Ionicons name="trophy" size={16} color="#D97706" />
          <Text style={styles.badgeButtonText}>View Badges</Text>
          {newBadgeCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{newBadgeCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 32,
  },
  badgeButton: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  badgeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  badgeCount: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
});
