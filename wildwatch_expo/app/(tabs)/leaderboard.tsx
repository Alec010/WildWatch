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
import {
  StarRating,
  LeaderboardPodium,
  RecognitionInfoModal,
} from "../../src/features/ratings/components";
import LottieView from "lottie-react-native";
import confettiTransparent from "../../assets/anim/confetti on transparent background.json";
import confettiLandscape from "../../assets/anim/Confetti.json";
import { getOfficeFullName } from "../../src/utils/officeUtils";

/**
 * 🎨 UI-only refresh
 * - No changes to routing, data fetching, podium, or header logic.
 * - Added colorful accents, modern cards, and refined spacing.
 * - Kept placeholder/dummy text but reduced opacity as requested.
 */

const palette = {
  brand: "#8B0000", // do not change brand
  brandDark: "#650000",
  gold: "#D4AF37",
  canvas: "#F8F9FA",
  card: "#FFFFFF",
  ink: "#1F2937",
  inkMuted: "#4B5563",
  line: "#E5E7EB",
  success: "#16A34A",
  infoSoft: "#FDF2F2",
  chip: "#F3F4F6",
};

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: palette.chip,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ fontSize: 12, color: palette.inkMuted }}>{label}</Text>
    </View>
  );
}

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
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onClick}
      style={{ flex: 1, alignItems: "center" }}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: isSelected ? "rgba(212,175,55,0.15)" : "transparent",
        }}
      >
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? palette.brand : "#6B7280"}
        />
        <Text
          style={{
            color: isSelected ? palette.brand : "#6B7280",
            fontWeight: isSelected ? "700" : "500",
            fontSize: 14,
          }}
        >
          {text}
        </Text>
      </View>
      {isSelected ? (
        <View
          style={{
            width: 42,
            height: 3,
            borderRadius: 2,
            marginTop: 8,
            backgroundColor: palette.brand,
          }}
        />
      ) : (
        <View style={{ height: 11 }} />
      )}
    </TouchableOpacity>
  );
}

function SegmentedTabs({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: palette.card,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Sliding indicator */}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          left: selected === 0 ? 0 : "50%",
          backgroundColor: "rgba(212,175,55,0.18)",
        }}
      />
      {[
        { label: "Students", icon: "school-outline" as const },
        { label: "Offices", icon: "business" as const },
      ].map((t, i) => (
        <TouchableOpacity
          key={t.label}
          onPress={() => onSelect(i)}
          activeOpacity={0.85}
          style={{ flex: 1, paddingVertical: 12 }}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === i }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={selected === i ? palette.brand : "#6B7280"}
            />
            <Text
              style={{
                fontWeight: selected === i ? "800" : "600",
                color: selected === i ? palette.brand : "#6B7280",
              }}
            >
              {t.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AccentStripe() {
  // Decorative colorful stripe used in cards
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        backgroundColor: palette.gold,
      }}
    />
  );
}

function LeaderboardItem({
  entry,
  rank,
  isTopThree,
  maxPoints = 1,
  isOffice = false,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isTopThree: boolean;
  maxPoints?: number;
  isOffice?: boolean;
}) {
  const color =
    rank === 1
      ? "#FFD700"
      : rank === 2
      ? "#C0C0C0"
      : rank === 3
      ? "#CD7F32"
      : "#4A5568";

  const borderColor = isTopThree ? color : "transparent";

  // Get display name - for offices in ranks 4-10, show full name
  const displayName = isOffice ? getOfficeFullName(entry.name) : entry.name;

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: 16,
        marginBottom: 10,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isTopThree ? 6 : 3 },
        shadowOpacity: isTopThree ? 0.18 : 0.12,
        shadowRadius: isTopThree ? 8 : 4,
        elevation: isTopThree ? 7 : 3,
        borderWidth: isTopThree ? 1.5 : 0,
        borderColor,
        overflow: "hidden",
      }}
    >
      <AccentStripe />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Rank Number */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3F4F6",
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 18, color }}>{rank}</Text>
        </View>

        <View style={{ width: 14 }} />

        {/* Name and Details */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{ fontWeight: "700", fontSize: 16, color: palette.ink }}
              numberOfLines={2}
            >
              {displayName}
            </Text>
            {entry.rank && entry.rank !== "NONE" ? (
              <RankBadge
                rank={entry.rank}
                goldRanking={entry.goldRanking}
                size="xs"
                showLabel={false}
              />
            ) : null}
          </View>

          {/* Stats Row with Stars */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {entry.averageRating && entry.averageRating > 0 ? (
              <>
                <StarRating
                  rating={entry.averageRating}
                  size={12}
                  showValue={true}
                />
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>•</Text>
              </>
            ) : null}

            {entry.totalIncidents && entry.totalIncidents > 0 ? (
              <>
                <Text style={{ fontSize: 12, color: palette.inkMuted }}>
                  {entry.totalIncidents} reports
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>•</Text>
              </>
            ) : null}

            <Chip label={`${entry.points || 0} pts`} />
          </View>
        </View>

        {/* Points Badge (kept, styled) */}
        <View
          style={{
            backgroundColor: palette.brand,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 12 }}>
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
        requestAnimationFrame(() => {
          setShowConfetti(true);
        });
      }
    });
    return () => subscription?.remove();
  }, [showConfetti]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isLoading && (topReporters.length > 0 || topOffices.length > 0)) {
        // Reset and immediately show confetti to trigger re-render
        setShowConfetti(false);
        // Use requestAnimationFrame to ensure state update happens in next frame
        requestAnimationFrame(() => {
          setShowConfetti(true);
        });
      }

      // Reset confetti when screen loses focus
      return () => {
        setShowConfetti(false);
      };
    }, [isLoading, topReporters, topOffices])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    // Reset and trigger confetti animation
    setShowConfetti(false);
    requestAnimationFrame(() => {
      setShowConfetti(true);
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: "Leaderboard" }} />
        {/* Dummy loading text retained */}
        <Text style={{ opacity: 0.6 }}>Loading Leaderboard...</Text>
      </View>
    );
  }

  const list = selectedTab === 0 ? topReporters : topOffices;
  const confettiAnimation =
    isLargeDevice && isLandscape ? confettiLandscape : confettiTransparent;

  return (
    <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
      <Stack.Screen options={{ title: "Leaderboard" }} />

      {/* Decorative colorful shapes (subtle) */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", right: -40, top: -20, opacity: 0.08 }}
      >
        <Ionicons name="trophy" size={180} color={palette.brand} />
      </View>
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -30, bottom: -10, opacity: 0.06 }}
      >
        <Ionicons name="sparkles" size={200} color={palette.gold} />
      </View>

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
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      )}

      {/* ⚠️ Header design preserved */}
      <View
        style={{
          backgroundColor: palette.brand,
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 0,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: palette.gold }}>
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
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {error ? (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderColor: "#FCA5A5",
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              margin: 16,
            }}
          >
            <Text style={{ color: "#991B1B", textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Tabs */}
        <SegmentedTabs selected={selectedTab} onSelect={setSelectedTab} />

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {/* ⚠️ Podium component preserved */}
          {list.length > 0 ? (
            <LeaderboardPodium
              entries={list.slice(0, 3)}
              type={selectedTab === 0 ? "students" : "offices"}
            />
          ) : null}

          {/* Leaderboard Rankings Section (4-10) */}
          <View style={{ marginTop: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: palette.brand,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 8,
                }}
              >
                <Ionicons name="people" size={15} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: palette.brand,
                }}
              >
                Leaderboard Rankings
              </Text>
            </View>

            {/* Actual entries if any */}

            {/* Always show placeholder cards for ranks 4-10 */}
            {(() => {
              const START_RANK = 4;
              const MAX_RANK = 10;
              const totalSlots = MAX_RANK - START_RANK + 1;
              const actualCount = Math.max(
                0,
                Math.min(Math.max(list.length - 3, 0), totalSlots)
              );
              const placeholders = totalSlots - actualCount;
              const maxPoints = Math.max(
                1,
                ...list.map((e: any) => e?.points || 0)
              );

              return (
                <>
                  {actualCount > 0
                    ? list
                        .slice(3, 3 + actualCount)
                        .map((entry, idx) => (
                          <LeaderboardItem
                            key={entry.id}
                            entry={entry}
                            rank={START_RANK + idx}
                            isTopThree={false}
                            maxPoints={maxPoints}
                            isOffice={selectedTab === 1}
                          />
                        ))
                    : null}

                  {Array.from({ length: placeholders }).map((_, i) => (
                    <PlaceholderCard
                      key={`placeholder-${START_RANK + actualCount + i}`}
                      rank={START_RANK + actualCount + i}
                    />
                  ))}
                </>
              );
            })()}
          </View>

          {/* Empty State */}
          {list.length === 0 && !error ? (
            <View
              style={{
                backgroundColor: palette.card,
                borderRadius: 14,
                padding: 24,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Ionicons name="trophy-outline" size={32} color="#9CA3AF" />
              <Text
                style={{ color: "#6B7280", marginTop: 8, textAlign: "center" }}
              >
                No leaderboard data available
              </Text>
            </View>
          ) : null}

          {/* How to Earn Recognition Section */}
          <View
            style={{
              backgroundColor: palette.infoSoft,
              borderRadius: 14,
              padding: 16,
              marginTop: 24,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: palette.brand,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: palette.brand,
                    marginBottom: 8,
                  }}
                >
                  How to Earn Recognition
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: palette.inkMuted,
                    lineHeight: 20,
                    marginBottom: 12,
                  }}
                >
                  Points are awarded based on the quality and quantity of your
                  contributions. Submit detailed reports, provide helpful
                  information, and maintain high ratings to climb the
                  leaderboard!
                </Text>
                <TouchableOpacity
                  onPress={() => setShowInfoModal(true)}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: palette.brand,
                    }}
                  >
                    Learn more about the recognition system
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={palette.brand}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Recognition Info Modal (unchanged) */}
      <RecognitionInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </View>
  );
}

// Placeholder card for empty leaderboard slots — kept with lower opacity
function PlaceholderCard({ rank }: { rank: number }) {
  return (
    <View
      style={{
        backgroundColor: "#F9FAFB",
        borderRadius: 14,
        marginBottom: 10,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: palette.line,
        opacity: 0.55, // requested lower opacity for dummy state
      }}
    >
      {/* Rank Number Circle */}
      <View
        style={{
          width: 42,
          height: 42,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#E5E7EB",
          borderRadius: 21,
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 15, color: "#6B7280" }}>
          #{rank}
        </Text>
      </View>

      <View style={{ width: 12 }} />

      {/* Placeholder Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 15,
            color: "#6B7280",
            fontStyle: "italic",
          }}
        >
          Your name could be here!
        </Text>
        <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Compete to claim this spot
        </Text>
      </View>

      {/* Placeholder Points */}
      <View
        style={{
          backgroundColor: "#E5E7EB",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}
      >
        <Text style={{ color: "#6B7280", fontWeight: "700", fontSize: 12 }}>
          ? pts
        </Text>
      </View>
    </View>
  );
}
