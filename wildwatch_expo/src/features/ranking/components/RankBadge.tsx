/**
 * RankBadge Component
 * Displays user rank badge with icon and optional label
 * Supports Bronze, Silver, Gold, and Gold Elite (Top 10) rankings
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserRank } from '../models/RankingModels';
import { RANK_COLORS, RANK_ICONS, RANK_NAMES } from '../models/RankingModels';

interface RankBadgeProps {
  rank: UserRank;
  goldRanking?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showGoldNumber?: boolean;
  animate?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  goldRanking,
  size = 'sm',
  showLabel = true,
  showGoldNumber = true,
  animate = false,
}) => {
  // Size configurations
  const iconSizes = { xs: 12, sm: 16, md: 20, lg: 24 };
  const textSizes = { xs: 10, sm: 12, md: 14, lg: 16 };
  const paddingSizes = { xs: 4, sm: 6, md: 8, lg: 10 };
  
  const iconSize = iconSizes[size];
  const textSize = textSizes[size];
  const padding = paddingSizes[size];

  // Get rank properties
  const color = RANK_COLORS[rank];
  const icon = RANK_ICONS[rank];
  const name = RANK_NAMES[rank];

  // Don't show anything for unranked users without label
  if (rank === 'NONE' && !showLabel) {
    return null;
  }

  // Build label text
  const getLabelText = () => {
    if (!showLabel) return null;
    
    let labelText = name;
    if (showGoldNumber && rank === 'GOLD' && goldRanking) {
      labelText += ` #${goldRanking}`;
    }
    return labelText;
  };

  const labelText = getLabelText();

  return (
    <View style={[styles.container, { padding: padding / 2 }]}>
      <View style={styles.content}>
        {/* Rank Icon */}
        <Ionicons 
          name={icon as any} 
          size={iconSize} 
          color={color} 
        />
        
        {/* Rank Label */}
        {labelText && (
          <Text 
            style={[
              styles.text, 
              { 
                color, 
                fontSize: textSize,
                marginLeft: 4,
              }
            ]}
          >
            {labelText}
          </Text>
        )}
      </View>

      {/* Optional shine effect for Gold rank */}
      {animate && rank === 'GOLD' && (
        <View style={[styles.shine, { backgroundColor: `${color}20` }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
});

