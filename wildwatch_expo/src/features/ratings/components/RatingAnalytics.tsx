import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RatingDimension } from '../models/RatingModels';

interface RatingAnalyticsProps {
  rating: RatingDimension | null;
  title: string;
  showBreakdown?: boolean;
}

export const RatingAnalytics: React.FC<RatingAnalyticsProps> = ({
  rating,
  title,
  showBreakdown = true,
}) => {
  if (!rating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="bar-chart" size={20} color="#6B7280" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No rating data available</Text>
        </View>
      </View>
    );
  }

  const dimensions = [
    { name: 'Honesty', value: rating.honesty, color: '#EF4444' },
    { name: 'Credibility', value: rating.credibility, color: '#3B82F6' },
    { name: 'Responsiveness', value: rating.responsiveness, color: '#10B981' },
    { name: 'Helpfulness', value: rating.helpfulness, color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={20} color="#6B7280" />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        {/* Overall Score */}
        <View style={styles.overallScore}>
          <View style={styles.scoreRow}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={styles.averageRating}>{rating.averageRating.toFixed(1)}</Text>
            <Text style={styles.maxRating}>/ 5.0</Text>
          </View>
          <View style={styles.pointsRow}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.totalPoints}>{rating.totalPoints}/20</Text>
            <Text style={styles.pointsLabel}>points</Text>
          </View>
        </View>

        {showBreakdown && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Dimension Breakdown</Text>
            {dimensions.map((dimension) => (
              <View key={dimension.name} style={styles.dimensionRow}>
                <View style={styles.dimensionInfo}>
                  <Text style={styles.dimensionName}>{dimension.name}</Text>
                  <Text style={styles.dimensionValue}>{dimension.value}/5</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(dimension.value / 5) * 100}%`,
                        backgroundColor: dimension.color,
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Feedback Section */}
        {rating.feedback && rating.feedback.trim() && (
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
              <Text style={styles.feedbackTitle}>Feedback</Text>
            </View>
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{rating.feedback}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    gap: 16,
  },
  overallScore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  maxRating: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 4,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  breakdown: {
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dimensionRow: {
    gap: 4,
  },
  dimensionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionName: {
    fontSize: 14,
    color: '#6B7280',
  },
  dimensionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  feedbackSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  feedbackContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

