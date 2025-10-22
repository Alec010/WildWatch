import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDisplay } from './BadgeDisplay';
import type { BadgeProgress } from '../models/BadgeModels';
import { BADGE_COLORS } from '../models/BadgeModels';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BadgeCardProps {
  badge: BadgeProgress;
  expanded?: boolean;
  onPress?: () => void;
  onClaim?: (badgeId: number) => Promise<void>;
}

export function BadgeCard({ 
  badge, 
  expanded = false, 
  onPress,
  onClaim 
}: BadgeCardProps) {
  const colors = BADGE_COLORS[badge.badgeType];
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const handleClaim = async () => {
    if (!onClaim || isClaiming) return;
    
    setIsClaiming(true);
    try {
      await onClaim(badge.badgeId);
      setIsClaimed(true);
    } catch (error) {
      // Error handled by parent component
    } finally {
      setIsClaiming(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onPress();
    }
  };

  const isCompleted = badge.currentLevel >= 3;
  const canClaim = isCompleted && !badge.pointsAwarded && !isClaimed;
  const hasClaimed = badge.pointsAwarded || isClaimed;

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.container,
        isCompleted && hasClaimed && styles.completedContainer,
        { borderColor: colors.border }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <BadgeDisplay badge={badge} size="md" showLevel={true} />
        
        <View style={styles.headerContent}>
          <Text 
            style={[
              styles.badgeName, 
              { color: badge.currentLevel > 0 ? colors.primary : '#6B7280' }
            ]}
          >
            {badge.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {badge.description}
          </Text>
        </View>

        <View style={[
          styles.pointBadge,
          hasClaimed ? styles.pointBadgeAwarded : styles.pointBadgePending
        ]}>
          <Ionicons 
            name="gift" 
            size={14} 
            color={hasClaimed ? '#10B981' : '#6B7280'} 
          />
          <Text style={[
            styles.pointText,
            hasClaimed ? styles.pointTextAwarded : styles.pointTextPending
          ]}>
            {hasClaimed ? `+${badge.pointReward} ✓` : `+${badge.pointReward}`}
          </Text>
        </View>
      </View>

      {/* Star System */}
      <View style={styles.starSection}>
        <View style={styles.starRow}>
          {[1, 2, 3].map((star) => (
            <View 
              key={star}
              style={[
                styles.starContainer,
                badge.currentLevel >= star ? styles.starEarned : styles.starLocked
              ]}
            >
              <Ionicons 
                name={badge.currentLevel >= star ? 'star' : 'star-outline'} 
                size={16} 
                color={badge.currentLevel >= star ? '#F59E0B' : '#9CA3AF'} 
              />
            </View>
          ))}
        </View>
        
        {/* Progress to next star */}
        {badge.currentLevel < 3 && (
          <>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Progress to next star: {badge.currentProgress} / {badge.nextLevelRequirement || '—'}
              </Text>
              <Text style={styles.progressPercentage}>
                {badge.progressPercentage.toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${badge.progressPercentage}%`,
                    backgroundColor: colors.primary,
                  }
                ]} 
              />
            </View>
          </>
        )}
      </View>

      {/* Claim Button */}
      {canClaim && (
        <TouchableOpacity
          onPress={handleClaim}
          disabled={isClaiming}
          style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
        >
          {isClaiming ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="trophy" size={16} color="white" />
              <Text style={styles.claimButtonText}>
                Claim Badge (+{badge.pointReward} pts)
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Claimed Status */}
      {hasClaimed && (
        <View style={styles.claimedContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.claimedText}>
            Badge Claimed! +{badge.pointReward} points awarded! 🎉
          </Text>
        </View>
      )}

      {/* Expanded Details */}
      {expanded && badge.levels.length > 0 && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedTitle}>How to Earn Stars</Text>
          {badge.levels.map((level) => (
            <View key={level.level} style={styles.levelRow}>
              <View style={[
                styles.levelIcon,
                level.achieved ? styles.levelIconAchieved : styles.levelIconLocked
              ]}>
                <Ionicons 
                  name={level.achieved ? 'checkmark-circle' : 'time-outline'} 
                  size={14} 
                  color={level.achieved ? '#10B981' : '#9CA3AF'} 
                />
              </View>
              <View style={styles.levelContent}>
                <Text style={[
                  styles.levelDescription,
                  !level.achieved && styles.levelDescriptionLocked
                ]}>
                  ⭐ {level.description}
                </Text>
                {level.achieved && level.awardedDate && (
                  <Text style={styles.levelDate}>
                    {new Date(level.awardedDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completedContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pointBadgePending: {
    backgroundColor: '#F3F4F6',
  },
  pointBadgeAwarded: {
    backgroundColor: '#D1FAE5',
  },
  pointText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointTextPending: {
    color: '#6B7280',
  },
  pointTextAwarded: {
    color: '#059669',
  },
  starSection: {
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEarned: {
    backgroundColor: '#FEF3C7',
  },
  starLocked: {
    backgroundColor: '#F3F4F6',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  claimButton: {
    marginTop: 12,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  claimedContainer: {
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimedText: {
    flex: 1,
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  levelIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIconAchieved: {
    backgroundColor: '#D1FAE5',
  },
  levelIconLocked: {
    backgroundColor: '#F3F4F6',
  },
  levelContent: {
    flex: 1,
  },
  levelDescription: {
    fontSize: 13,
    color: '#1F2937',
  },
  levelDescriptionLocked: {
    color: '#6B7280',
  },
  levelDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

