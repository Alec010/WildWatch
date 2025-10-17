import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import TopSpacing from "../../components/TopSpacing";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboard } from "../../src/features/ratings/hooks/useLeaderboard";
import type { LeaderboardEntry } from "../../src/features/ratings/models/RatingModels";

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
  return (
    <View
      className="bg-white rounded-xl mb-2"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isTopThree ? 4 : 2 },
        shadowOpacity: 0.1,
        shadowRadius: isTopThree ? 4 : 2,
        elevation: isTopThree ? 4 : 2,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "600", fontSize: 16, color: "#2D3748" }}>
            {entry.name}
          </Text>
          <Text style={{ fontSize: 14, color: "#718096" }}>
            Score: {entry.points || 0}
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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
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

  return (
    <View className="flex-1" style={{ backgroundColor: "#F8F9FA" }}>
      <Stack.Screen options={{ title: "Leaderboard" }} />

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
          {list.map((entry, index) => (
            <LeaderboardItem
              key={entry.id}
              entry={entry}
              rank={index + 1}
              isTopThree={index < 3}
            />
          ))}
          {list.length === 0 && !error ? (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons name="trophy-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 text-center">
                No leaderboard data available
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
