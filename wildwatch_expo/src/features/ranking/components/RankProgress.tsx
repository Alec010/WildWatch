// Rank progress component showing current rank and progress to next tier
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RankProgress as RankProgressType } from '../models/RankingModels';
import { RANK_COLORS, RANK_ICONS, RANK_NAMES } from '../models/RankingModels';

interface RankProgressProps {
  rankProgress: RankProgressType;
}

export const RankProgress: React.FC<RankProgressProps> = ({ rankProgress }) => {
  const { currentRank, currentPoints, nextRank, pointsToNextRank, progressPercentage, goldRanking } = rankProgress;
  const isMaxRank = currentRank === 'GOLD';

  return (
    <View style={styles.container}>
      {/* Current Rank Section */}
      <View style={styles.currentRankSection}>
        <View style={styles.currentRankInfo}>
          <View style={styles.rankIconContainer}>
            <Ionicons 
              name={RANK_ICONS[currentRank] as any} 
              size={24} 
              color={RANK_COLORS[currentRank]} 
            />
          </View>
          <View style={styles.rankDetails}>
            <Text style={[styles.rankName, { color: RANK_COLORS[currentRank] }]}>
              {RANK_NAMES[currentRank]}
              {goldRanking && ` #${goldRanking}`}
            </Text>
            <Text style={styles.pointsText}>{currentPoints} points</Text>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      {!isMaxRank && nextRank && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.targetInfo}>
              <Ionicons name="flag" size={14} color="#6B7280" />
              <Text style={styles.targetText}>{pointsToNextRank} to {RANK_NAMES[nextRank]}</Text>
            </View>
            <Text style={styles.percentageText}>{Math.round(progressPercentage)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: RANK_COLORS[nextRank] 
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.progressFooter}>
            <Text style={styles.pointsNeededText}>
              {pointsToNextRank} more points to reach {RANK_NAMES[nextRank]}
            </Text>
            <View style={styles.nextRankInfo}>
              <Text style={styles.nextRankLabel}>Next Rank</Text>
              <View style={styles.nextRankBadge}>
                <Ionicons 
                  name={RANK_ICONS[nextRank] as any} 
                  size={16} 
                  color={RANK_COLORS[nextRank]} 
                />
                <Text style={[styles.nextRankName, { color: RANK_COLORS[nextRank] }]}>
                  {RANK_NAMES[nextRank]}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Max Rank Message */}
      {isMaxRank && (
        <View style={styles.maxRankSection}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <Text style={styles.maxRankText}>You've reached the highest rank!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentRankSection: {
    marginBottom: 16,
  },
  currentRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pointsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 12,
    color: '#6B7280',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pointsNeededText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  nextRankInfo: {
    alignItems: 'flex-end',
  },
  nextRankLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  nextRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  nextRankName: {
    fontSize: 12,
    fontWeight: '600',
  },
  maxRankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  maxRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
