import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BadgeProgress } from '../models/BadgeModels';
import { BADGE_COLORS, BADGE_ICONS } from '../models/BadgeModels';

interface BadgeDisplayProps {
  badge: BadgeProgress;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  showName?: boolean;
}

const SIZES = {
  sm: { container: 32, icon: 16, levelBadge: 12, levelText: 8 },
  md: { container: 48, icon: 24, levelBadge: 16, levelText: 10 },
  lg: { container: 64, icon: 32, levelBadge: 20, levelText: 12 },
};

export function BadgeDisplay({
  badge,
  size = 'md',
  showLevel = true,
  showName = false,
}: BadgeDisplayProps) {
  const colors = BADGE_COLORS[badge.badgeType];
  const iconName = BADGE_ICONS[badge.badgeType];
  const dimensions = SIZES[size];

  return (
    <View style={styles.container}>
      <View style={[styles.badgeContainer, { width: dimensions.container, height: dimensions.container }]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient, 
            { 
              borderRadius: dimensions.container / 2,
              borderColor: colors.border,
            }
          ]}
        >
          <Ionicons 
            name={iconName as any} 
            size={dimensions.icon} 
            color="white" 
          />
        </LinearGradient>

        {/* Level indicator */}
        {showLevel && badge.currentLevel > 0 && (
          <View 
            style={[
              styles.levelBadge, 
              { 
                width: dimensions.levelBadge, 
                height: dimensions.levelBadge,
                borderColor: colors.primary,
                borderRadius: dimensions.levelBadge / 2,
              }
            ]}
          >
            <Text style={[styles.levelText, { fontSize: dimensions.levelText, color: colors.primary }]}>
              {badge.currentLevel}★
            </Text>
          </View>
        )}

        {/* Locked overlay */}
        {badge.currentLevel === 0 && (
          <View style={[styles.lockedOverlay, { borderRadius: dimensions.container / 2 }]}>
            <Ionicons name="lock-closed" size={dimensions.icon / 2} color="white" />
          </View>
        )}
      </View>

      {/* Badge name */}
      {showName && (
        <View style={styles.nameContainer}>
          <Text 
            style={[
              styles.badgeName, 
              { color: badge.currentLevel > 0 ? colors.primary : '#9CA3AF' }
            ]}
            numberOfLines={1}
          >
            {badge.name}
          </Text>
          {badge.currentLevel > 0 && (
            <Text style={styles.levelLabel}>Level {badge.currentLevel}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  levelText: {
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(107, 114, 128, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    marginTop: 4,
    alignItems: 'center',
    maxWidth: 80,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  levelLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});

