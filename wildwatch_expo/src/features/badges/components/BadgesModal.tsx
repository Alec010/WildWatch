import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeCard } from './BadgeCard';
import { BadgeCelebration } from './BadgeCelebration';
import type { UserBadgeSummary } from '../models/BadgeModels';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeSummary: UserBadgeSummary | null;
  isLoading: boolean;
  onClaimBadge?: (badgeId: number) => Promise<void>;
}

type FilterType = 'all' | 'earned' | 'unearned';

export function BadgesModal({
  isOpen,
  onClose,
  badgeSummary,
  isLoading,
  onClaimBadge,
}: BadgesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedBadgeId, setExpandedBadgeId] = useState<number | null>(null);
  const [celebrationBadgeName, setCelebrationBadgeName] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Filter badges based on search and filter type
  const filteredBadges = useMemo(() => {
    if (!badgeSummary) return [];

    return badgeSummary.badges.filter((badge) => {
      // Apply search filter
      const matchesSearch =
        searchTerm === '' ||
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply earned/unearned filter
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'earned' && badge.currentLevel > 0) ||
        (filterType === 'unearned' && badge.currentLevel === 0);

      return matchesSearch && matchesFilter;
    });
  }, [badgeSummary, searchTerm, filterType]);

  const handleClaimBadge = async (badgeId: number) => {
    const badge = badgeSummary?.badges.find((b) => b.badgeId === badgeId);
    if (!badge || !onClaimBadge) return;

    try {
      await onClaimBadge(badgeId);
      setCelebrationBadgeName(badge.name);
      setShowCelebration(true);
    } catch (error) {
      // Error handled by parent component
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setFilterType('all');
    setExpandedBadgeId(null);
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Loading badges...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // No badges state
  if (!badgeSummary) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Badges</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8B0000" />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No badges available</Text>
            <Text style={styles.emptyDescription}>
              There was an error loading your badges. Please try again later.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={styles.headerTitle}>Your Badges</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8B0000" />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.summaryCardBlue]}>
              <Text style={styles.summaryLabel}>Badges Earned</Text>
              <Text style={styles.summaryValue}>
                {badgeSummary.totalBadgesEarned}/{badgeSummary.totalBadgesAvailable}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardGreen]}>
              <Text style={styles.summaryLabel}>Points Earned</Text>
              <Text style={styles.summaryValue}>
                +{badgeSummary.totalPointsEarned}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardAmber]}>
              <Text style={styles.summaryLabel}>Completion</Text>
              <Text style={styles.summaryValue}>
                {Math.round(
                  (badgeSummary.totalBadgesEarned /
                    badgeSummary.totalBadgesAvailable) *
                    100
                )}
                %
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View style={styles.controlsContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search badges..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterType === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType('all')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === 'all' && styles.filterButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterType === 'earned' && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType('earned')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === 'earned' && styles.filterButtonTextActive,
                  ]}
                >
                  Earned
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterType === 'unearned' && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType('unearned')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === 'unearned' && styles.filterButtonTextActive,
                  ]}
                >
                  Unearned
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Badge List */}
          <ScrollView
            style={styles.badgeList}
            contentContainerStyle={styles.badgeListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredBadges.length === 0 ? (
              <View style={styles.emptyResultsContainer}>
                <Ionicons name="filter-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyResultsText}>
                  No badges match your filters
                </Text>
              </View>
            ) : (
              filteredBadges.map((badge) => (
                <BadgeCard
                  key={badge.badgeId}
                  badge={badge}
                  expanded={expandedBadgeId === badge.badgeId}
                  onPress={() =>
                    setExpandedBadgeId(
                      expandedBadgeId === badge.badgeId ? null : badge.badgeId
                    )
                  }
                  onClaim={handleClaimBadge}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Celebration Modal */}
      <BadgeCelebration
        isVisible={showCelebration}
        badgeName={celebrationBadgeName}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryCardBlue: {
    backgroundColor: '#EFF6FF',
  },
  summaryCardGreen: {
    backgroundColor: '#ECFDF5',
  },
  summaryCardAmber: {
    backgroundColor: '#FFFBEB',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#8B0000',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  badgeList: {
    flex: 1,
  },
  badgeListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyResultsContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

