/**
 * LeaderboardPodium Component
 * Displays top 3 users in a podium-style layout
 * Matches web design with mobile-friendly responsive layout
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { LeaderboardEntry } from '../models/RatingModels';
import { RankBadge } from '../../ranking/components';
import { StarRating } from './StarRating';

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];  // First 3 entries
  type: 'students' | 'offices';
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ 
  entries, 
  type 
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 768;
  
  // Ensure we have exactly 3 entries (fill with placeholders if needed)
  const podiumEntries = [...entries];
  while (podiumEntries.length < 3) {
    podiumEntries.push({
      id: 0,
      name: '',
      points: 0,
      rank: 'NONE',
      averageRating: 0,
      totalIncidents: 0,
    });
  }

  const getPodiumData = (index: number) => {
    const entry = podiumEntries[index];
    const isEmpty = !entry.name;
    
    // Calculate responsive widths based on screen size
    const availableWidth = screenWidth - 40; // Account for padding
    const cardWidth = Math.min(availableWidth / 3.2, isTablet ? 120 : 100);
    
    switch (index) {
      case 0: // 1st place - Center, tallest
        return {
          height: isTablet ? 140 : 120,
          width: cardWidth,
          color: '#FFD700', // Gold
          icon: 'crown' as const,
          position: 'center',
          rank: 1,
          gradient: ['#FFD700', '#FFA500'],
          textColor: '#8B0000',
        };
      case 1: // 2nd place - Left
        return {
          height: isTablet ? 120 : 100,
          width: cardWidth,
          color: '#C0C0C0', // Silver
          icon: 'trophy' as const,
          position: 'left',
          rank: 2,
          gradient: ['#C0C0C0', '#A8A8A8'],
          textColor: '#4A5568',
        };
      case 2: // 3rd place - Right
        return {
          height: isTablet ? 100 : 80,
          width: cardWidth,
          color: '#CD7F32', // Bronze
          icon: 'medal' as const,
          position: 'right',
          rank: 3,
          gradient: ['#CD7F32', '#B8860B'],
          textColor: '#4A5568',
        };
      default:
        return {
          height: 80,
          width: cardWidth,
          color: '#E5E7EB',
          icon: 'person' as const,
          position: 'center',
          rank: index + 1,
          gradient: ['#E5E7EB', '#D1D5DB'],
          textColor: '#6B7280',
        };
    }
  };

  const PodiumCard = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
    const podiumData = getPodiumData(index);
    const isEmpty = !entry.name;
    
    if (isEmpty) {
      return (
        <View style={[styles.podiumCard, { 
          height: podiumData.height,
          width: podiumData.width,
          backgroundColor: '#F3F4F6',
          borderColor: '#E5E7EB',
          borderWidth: 2,
          borderStyle: 'dashed',
        }]}>
          <View style={styles.emptyCard}>
            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {type === 'students' ? 'Your name could be here!' : 'Your office could be here!'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.podiumCard, { 
        height: podiumData.height,
        width: podiumData.width,
      }]}>
        <LinearGradient
          colors={podiumData.gradient}
          style={styles.podiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Sparkle overlay for 1st place */}
          {index === 0 && (
            <View style={styles.sparkleOverlay}>
              <View style={[styles.sparkle, { top: 10, left: 20 }]} />
              <View style={[styles.sparkle, { top: 30, right: 15 }]} />
              <View style={[styles.sparkle, { bottom: 20, left: 30 }]} />
            </View>
          )}

          {/* Avatar Circle */}
          <View style={[styles.avatarCircle, { 
            borderColor: podiumData.color,
            backgroundColor: 'white',
          }]}>
            {entry.name ? (
              <Text style={[styles.avatarText, { color: '#8B0000' }]}>
                {entry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={20} color="#9CA3AF" />
            )}
          </View>

          {/* Name */}
          <Text style={[styles.podiumName, { color: 'white' }]} numberOfLines={1}>
            {entry.name}
          </Text>

          {/* Rank Badge */}
          {entry.rank && entry.rank !== 'NONE' && (
            <View style={styles.rankBadgeContainer}>
              <RankBadge 
                rank={entry.rank} 
                goldRanking={entry.goldRanking}
                size="xs"
                showLabel={false}
              />
            </View>
          )}

          {/* Points */}
          <Text style={[styles.podiumPoints, { color: 'white' }]}>
            {entry.points || 0} pts
          </Text>

          {/* Star Rating */}
          {entry.averageRating && entry.averageRating > 0 && (
            <View style={styles.starContainer}>
              <StarRating 
                rating={entry.averageRating} 
                size={10}
                showValue={false}
                color="white"
                emptyColor="rgba(255,255,255,0.5)"
              />
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="trophy" size={20} color="#8B0000" />
        </View>
        <Text style={styles.headerTitle}>Top 3 Champions</Text>
      </View>

      {/* Podium */}
      <View style={styles.podiumContainer}>
        {/* Background decoration */}
        <View style={styles.backgroundDecoration}>
          <View style={[styles.decorationCircle, { top: 20, left: 20 }]} />
          <View style={[styles.decorationCircle, { top: 40, right: 30 }]} />
          <View style={[styles.decorationCircle, { bottom: 30, left: 40 }]} />
        </View>

        {/* Podium Cards */}
        <View style={styles.podiumCards}>
          {/* 2nd Place - Left */}
          <PodiumCard entry={podiumEntries[1]} index={1} />
          
          {/* 1st Place - Center */}
          <PodiumCard entry={podiumEntries[0]} index={0} />
          
          {/* 3rd Place - Right */}
          <PodiumCard entry={podiumEntries[2]} index={2} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  podiumContainer: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  decorationCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
  },
  podiumCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 140,
    paddingHorizontal: 4,
  },
  podiumCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  podiumGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    minHeight: 120,
  },
  sparkleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  rankBadgeContainer: {
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  starContainer: {
    marginTop: 4,
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  emptyText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
});
