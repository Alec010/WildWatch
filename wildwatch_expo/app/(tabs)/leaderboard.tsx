import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboard } from "../../src/features/ratings/hooks/useLeaderboard";
import type { LeaderboardEntry } from "../../src/features/ratings/models/RatingModels";
import { RankBadge } from "../../src/features/ranking/components";
import { StarRating, LeaderboardPodium, RecognitionInfoModal } from "../../src/features/ratings/components";
import LottieView from "lottie-react-native";
import confettiTransparent from "../../assets/anim/confetti on transparent background.json";
import confettiLandscape from "../../assets/anim/Confetti.json";

function CustomTab({
  text,
  icon,
  isSelected,
  onClick,
}: {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <View
      className="flex-1 items-center"
      style={{ paddingVertical: 12, borderRadius: 8 }}
    >
      <Text
        onPress={onClick}
        style={{
          color: isSelected ? "#8B0000" : "#6B7280",
          fontWeight: isSelected ? "600" : "400",
          fontSize: 14,
        }}
      >
        {text}
      </Text>
      {isSelected ? (
        <View
          className="bg-[#8B0000] rounded"
          style={{ width: 40, height: 3, borderRadius: 2, marginTop: 8 }}
        />
      ) : null}
    </View>
  );
}

function LeaderboardItem({
  entry,
  rank,
  isTopThree,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isTopThree: boolean;
}) {
  const color =
    rank === 1
      ? "#FFD700"
      : rank === 2
      ? "#C0C0C0"
      : rank === 3
      ? "#CD7F32"
      : "#4A5568";

  // Add border color for top 3
  const borderColor = isTopThree ? color : 'transparent';

  return (
    <View
      className="bg-white rounded-xl mb-2"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isTopThree ? 4 : 2 },
        shadowOpacity: isTopThree ? 0.15 : 0.1,
        shadowRadius: isTopThree ? 6 : 2,
        elevation: isTopThree ? 6 : 2,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: isTopThree ? 2 : 0,
        borderColor: borderColor,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        {/* Rank Number */}
        <View
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 18, color }}>{rank}</Text>
        </View>
        
        <View style={{ width: 16 }} />
        
        {/* Name and Details */}
        <View style={{ flex: 1 }}>
          {/* Name Row with Rank Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontWeight: "600", fontSize: 16, color: "#2D3748" }}>
              {entry.name}
            </Text>
            
            {/* ✨ NEW: Rank Badge */}
            {entry.rank && entry.rank !== 'NONE' && (
              <RankBadge 
                rank={entry.rank} 
                goldRanking={entry.goldRanking}
                size="xs"
                showLabel={false}
              />
            )}
          </View>
          
          {/* Stats Row with Stars */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {/* ✨ NEW: Star Rating */}
            {entry.averageRating && entry.averageRating > 0 && (
              <>
                <StarRating 
                  rating={entry.averageRating} 
                  size={12}
                  showValue={true}
                />
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>•</Text>
              </>
            )}
            
            {/* Total Incidents */}
            {entry.totalIncidents && entry.totalIncidents > 0 && (
              <>
                <Text style={{ fontSize: 12, color: "#718096" }}>
                  {entry.totalIncidents} reports
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>•</Text>
              </>
            )}
            
            {/* Points */}
            <Text style={{ fontSize: 12, color: "#718096" }}>
              {entry.points || 0} pts
            </Text>
          </View>
        </View>
        
        {/* Points Badge */}
        <View style={{
          backgroundColor: '#8B0000',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
            {entry.points || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { topReporters, topOffices, isLoading, error, refresh } =
    useLeaderboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const confettiRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const isLandscape = screenWidth > screenHeight;
  const isLargeDevice = screenWidth > 670;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
      if (showConfetti) {
        setShowConfetti(false);
        setTimeout(() => setShowConfetti(true), 100);
      }
    });
    return () => subscription?.remove();
  }, [showConfetti]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isLoading && (topReporters.length > 0 || topOffices.length > 0)) {
        setShowConfetti(false);
        const timer = setTimeout(() => {
          setShowConfetti(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isLoading, topReporters, topOffices])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 300);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: "Leaderboard" }} />
        <Text>Loading Leaderboard...</Text>
      </View>
    );
  }

  const list = selectedTab === 0 ? topReporters : topOffices;
  const confettiAnimation =
    isLargeDevice && isLandscape ? confettiLandscape : confettiTransparent;

  return (
    <View className="flex-1" style={{ backgroundColor: "#F8F9FA" }}>
      <Stack.Screen options={{ title: "Leaderboard" }} />

      {showConfetti && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: screenWidth,
            height: screenHeight,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <LottieView
            ref={confettiRef}
            source={confettiAnimation}
            autoPlay
            loop={false}
            resizeMode="cover"
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </View>
      )}

      <View
        style={{
          backgroundColor: "#8B0000",
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 0,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#D4AF37" }}>
          Leaderboard
        </Text>
        <Text style={{ color: "#FFFFFF", marginTop: 4 }}>
          See who's leading in incident reporting.
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 text-center">{error}</Text>
          </View>
        ) : null}
        <View
          className="bg-white mb-4 rounded-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View className="flex-row" style={{ paddingVertical: 8 }}>
            <CustomTab
              text="Students"
              icon="school-outline"
              isSelected={selectedTab === 0}
              onClick={() => setSelectedTab(0)}
            />
            <CustomTab
              text="Offices"
              icon="business"
              isSelected={selectedTab === 1}
              onClick={() => setSelectedTab(1)}
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          {/* Top 3 Podium Section */}
          {list.length > 0 && (
            <LeaderboardPodium 
              entries={list.slice(0, 3)} 
              type={selectedTab === 0 ? 'students' : 'offices'}
            />
          )}

          {/* Leaderboard Rankings Section (4-10) */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                <Ionicons name="people" size={14} color="white" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#8B0000' }}>
                Leaderboard Rankings
              </Text>
            </View>
            
            {/* Show actual entries if they exist */}
            {list.length > 3 && list.slice(3, 10).map((entry, index) => (
              <LeaderboardItem
                key={entry.id}
                entry={entry}
                rank={index + 4}
                isTopThree={false}
              />
            ))}
            
            {/* Always show placeholder cards for ranks 4-10 */}
            {Array(7).fill(null).map((_, i) => (
              <PlaceholderCard key={`placeholder-${i}`} rank={i + 4} />
            ))}
          </View>

          {/* Empty State */}
          {list.length === 0 && !error ? (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons name="trophy-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 text-center">
                No leaderboard data available
              </Text>
            </View>
          ) : null}

          {/* How to Earn Recognition Section */}
          <View style={{
            backgroundColor: '#FDF2F2',
            borderRadius: 12,
            padding: 16,
            marginTop: 20,
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#8B0000',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#8B0000',
                  marginBottom: 8,
                }}>
                  How to Earn Recognition
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#4B5563',
                  lineHeight: 20,
                  marginBottom: 12,
                }}>
                  Points are awarded based on the quality and quantity of your contributions. Submit detailed reports,
                  provide helpful information, and maintain high ratings to climb the leaderboard!
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowInfoModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#8B0000',
                  }}>
                    Learn more about the recognition system
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#8B0000" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Recognition Info Modal */}
      <RecognitionInfoModal 
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </View>
  );
}

// Placeholder card for empty leaderboard slots
function PlaceholderCard({ rank }: { rank: number }) {
  return (
    <View style={{
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      marginBottom: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    }}>
      {/* Rank Number Circle */}
      <View style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 20,
      }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: '#6B7280' }}>#{rank}</Text>
      </View>
      
      <View style={{ width: 16 }} />
      
      {/* Placeholder Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 16, color: '#6B7280', fontStyle: 'italic' }}>
          Your name could be here!
        </Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
          Compete to claim this spot
        </Text>
      </View>
      
      {/* Placeholder Points */}
      <View style={{
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
      }}>
        <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 12 }}>
          ? pts
        </Text>
      </View>
    </View>
  );
}
