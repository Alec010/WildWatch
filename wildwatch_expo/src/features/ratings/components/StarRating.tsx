/**
 * StarRating Component
 * Displays star rating (1-5 stars) for user reviews
 * Supports full stars, half stars, and empty stars
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  color?: string;
  emptyColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 14,
  showValue = true,
  color = '#F59E0B',
  emptyColor = '#D1D5DB',
}) => {
  // Clamp rating between 0 and maxStars
  const clampedRating = Math.max(0, Math.min(maxStars, rating));
  
  // Calculate full stars and half star
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Stars Container */}
      <View style={styles.starsContainer}>
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, index) => (
          <Ionicons
            key={`full-${index}`}
            name="star"
            size={size}
            color={color}
          />
        ))}
        
        {/* Half Star */}
        {hasHalfStar && (
          <Ionicons
            name="star-half"
            size={size}
            color={color}
          />
        )}
        
        {/* Empty Stars */}
        {[...Array(emptyStars)].map((_, index) => (
          <Ionicons
            key={`empty-${index}`}
            name="star-outline"
            size={size}
            color={emptyColor}
          />
        ))}
      </View>
      
      {/* Rating Value Text */}
      {showValue && (
        <Text style={[styles.valueText, { fontSize: size }]}>
          {clampedRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  valueText: {
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
});

