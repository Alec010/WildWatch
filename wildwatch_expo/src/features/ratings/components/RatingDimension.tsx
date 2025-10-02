import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingDimensionProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const RatingDimension: React.FC<RatingDimensionProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
      </View>
      
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => !disabled && onChange(star)}
            onPressIn={() => !disabled && setHoveredStar(star)}
            onPressOut={() => !disabled && setHoveredStar(0)}
            disabled={disabled}
            style={styles.starButton}
          >
            <Ionicons
              name="star"
              size={24}
              color={
                star <= (hoveredStar || value || 0)
                  ? "#FCD34D"
                  : "#D1D5DB"
              }
            />
          </TouchableOpacity>
        ))}
      </View>
      
      {value && (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            {value}/5 stars ({value} point{value !== 1 ? 's' : ''})
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

