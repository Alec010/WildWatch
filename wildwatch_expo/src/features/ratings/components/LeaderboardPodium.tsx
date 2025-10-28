/**
 * LeaderboardPodium Component
 * Displays top 3 users in a horizontal podium-style layout with trophy images
 * Features gradient backgrounds and static positioning
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { LeaderboardEntry } from "../models/RatingModels";
import { getOfficeFullName } from "../../../utils/officeUtils";

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]; // First 3 entries
  type: "students" | "offices";
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  entries,
  type,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const isTablet = screenWidth > 768;
  const isLargeDevice = screenWidth > 670;
  const isLandscape = screenWidth > screenHeight;

  // Responsive scaling factors
  const getScaleFactor = () => {
    if (isTablet) return 1.3;
    if (isLargeDevice) return 1.1;
    if (screenWidth < 350) return 0.8;
    if (screenWidth < 400) return 0.9;
    return 1.0;
  };

  const scaleFactor = getScaleFactor();

  // Removed floating animation for static cards

  // Ensure we have exactly 3 entries (fill with placeholders if needed)
  const podiumEntries = [...entries];
  while (podiumEntries.length < 3) {
    podiumEntries.push({
      id: 0,
      name: "",
      points: 0,
      rank: "NONE",
      averageRating: 0,
      totalIncidents: 0,
    });
  }

  // Office podium design
  if (type === "offices") {
    return <OfficePodium entries={podiumEntries} />;
  }

  const getPodiumData = (index: number) => {
    const entry = podiumEntries[index];
    const isEmpty = !entry.name;

    switch (index) {
      case 0: // 1st Place - Center
        return {
          height: Math.round(150 * scaleFactor),
          width: Math.round(140 * scaleFactor),
          color: "#FFD700",
          borderColor: "#FFD700",
          gradient: ["#FFD700", "#FFA500", "#FF8C00"],
          pointsColor: "#8B4513",
          trophyImage: require("../../../../assets/images/trophies/gold_student.png"),
        };
      case 1: // 2nd Place - Left
        return {
          height: Math.round(120 * scaleFactor),
          width: Math.round(125 * scaleFactor),
          color: "#2C6FFF",
          borderColor: "#2C6FFF",
          gradient: [
            "rgba(44, 111, 255, 0.35)",
            "rgba(30, 64, 175, 0.25)",
            "rgba(30, 58, 138, 0.15)",
          ],
          pointsColor: "#1E3A8A",
          trophyImage: require("../../../../assets/images/trophies/silver_student.png"),
        };
      case 2: // 3rd Place - Right
        return {
          height: Math.round(120 * scaleFactor),
          width: Math.round(125 * scaleFactor),
          color: "#00C37A",
          borderColor: "#00C37A",
          gradient: [
            "rgba(0, 195, 122, 0.35)",
            "rgba(5, 150, 105, 0.25)",
            "rgba(4, 120, 87, 0.15)",
          ],
          pointsColor: "#065F46",
          trophyImage: require("../../../../assets/images/trophies/bronze_student.png"),
        };
      default:
        return {
          height: Math.round(200 * scaleFactor),
          width: Math.round(110 * scaleFactor),
          color: "#4A5568",
          borderColor: "#4A5568",
          gradient: ["#4A5568", "#2D3748", "#1A202C"],
          pointsColor: "#718096",
          trophyImage: null,
        };
    }
  };

  const PodiumCard = ({
    entry,
    index,
  }: {
    entry: LeaderboardEntry;
    index: number;
  }) => {
    const podiumData = getPodiumData(index);
    const isEmpty = !entry.name;

    if (isEmpty) {
      return (
        <View
          style={[
            styles.podiumCard,
            {
              height: podiumData.height,
              width: podiumData.width,
              zIndex: index === 0 ? 10 : 1,
            },
          ]}
        >
          {/* Trophy Icon - Outside the gradient container for iOS */}
          <View
            style={[
              styles.trophyContainer,
              {
                height: 50 * scaleFactor,
                top: -50 * scaleFactor,
                width: 160 * scaleFactor,
                marginLeft: -80 * scaleFactor,
              },
            ]}
          >
            <Ionicons
              name="trophy-outline"
              size={40 * scaleFactor}
              color="rgba(255, 255, 255, 0.9)"
            />
          </View>

          <LinearGradient
            colors={podiumData.gradient as [string, string, ...string[]]}
            style={styles.podiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[
                styles.podiumName,
                {
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: 13 * scaleFactor,
                  marginTop: 8 * scaleFactor, // Add padding between image and name
                },
                index !== 0 && { marginTop: 4 * scaleFactor }, // Less padding for 2nd and 3rd place
              ]}
            >
              {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
            </Text>
            <Text
              style={[
                styles.podiumPoints,
                {
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: 18 * scaleFactor,
                },
              ]}
            >
              Open
            </Text>
            <Text
              style={[
                styles.podiumUsername,
                {
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: 10 * scaleFactor,
                },
              ]}
            >
              {index === 0 ? "Be first!" : "Join now"}
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.podiumCard,
          {
            height: podiumData.height,
            width: podiumData.width,
            zIndex: index === 0 ? 10 : 1,
          },
        ]}
      >
        {/* Trophy Image - Outside the gradient container for iOS */}
        <View
          style={[
            styles.trophyContainer,
            {
              width: 160 * scaleFactor,
              height: 160 * scaleFactor,
              top: -100 * scaleFactor,
              marginLeft: -80 * scaleFactor,
            },
          ]}
        >
          <Image
            source={podiumData.trophyImage}
            style={[
              styles.trophyImage,
              {
                width: 120 * scaleFactor,
                height: 120 * scaleFactor,
              },
              index !== 0 && {
                width: 100 * scaleFactor,
                height: 100 * scaleFactor,
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <LinearGradient
          colors={[...podiumData.gradient] as [string, string, ...string[]]}
          style={styles.podiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Name */}
          <Text
            style={[
              styles.podiumName,
              {
                color: "white",
                fontSize: 13 * scaleFactor,
                marginTop: 8 * scaleFactor, // Add padding between image and name
              },
              index !== 0 && { marginTop: 4 * scaleFactor }, // Less padding for 2nd and 3rd place
            ]}
            numberOfLines={1}
          >
            {entry.name}
          </Text>

          {/* Points */}
          <Text
            style={[
              styles.podiumPoints,
              {
                color: podiumData.pointsColor,
                fontSize: 18 * scaleFactor,
              },
              index !== 0 && { marginTop: -2 * scaleFactor },
            ]}
          >
            {entry.points || 0}
          </Text>

          {/* Username (if available) */}
          {entry.name && (
            <Text
              style={[
                styles.podiumUsername,
                {
                  color: "#9BA3B4",
                  fontSize: 10 * scaleFactor,
                },
                index !== 0 && { marginTop: -2 * scaleFactor },
              ]}
              numberOfLines={1}
            >
              @{entry.name.toLowerCase().replace(/\s+/g, "")}
            </Text>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Podium Wrapper with overflow protection */}
      <View
        style={[
          styles.podiumWrapper,
          {
            paddingTop: 80 * scaleFactor,
            paddingBottom: 8 * scaleFactor,
          },
        ]}
      >
        {/* Podium Container */}
        <View
          style={[
            styles.podiumContainer,
            {
              paddingHorizontal: 16 * scaleFactor,
            },
          ]}
        >
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
    marginTop: 24,
    marginBottom: 24,
  },
  podiumWrapper: {
    paddingTop: 80, // Space for trophy and crown to extend above
    paddingBottom: 8, // 8px space between podium and tabs
    overflow: "visible",
    ...(Platform.OS === "ios" && {
      overflow: undefined,
    }),
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    overflow: "visible",
    ...(Platform.OS === "ios" && {
      overflow: undefined,
    }),
  },
  podiumCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "visible",
    position: "relative",
    ...(Platform.OS === "ios" && {
      overflow: undefined,
    }),
  },
  podiumGradient: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
    ...(Platform.OS === "ios" && {
      overflow: undefined,
    }),
  },
  trophyContainer: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -80, // Half of width to center
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  trophyImage: {
    width: 120,
    height: 120,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 1,
  },
  podiumPoints: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 1,
  },
  podiumUsername: {
    fontSize: 10,
    textAlign: "center",
    opacity: 0.8,
  },
  // Office Podium Styles
  officePodiumContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  officePodiumWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    gap: 0,
    paddingTop: 160, // Space for floating elements
  },
  officeStageWrapper: {
    alignItems: "center",
    position: "relative",
    zIndex: 10,
  },
  officeStageWrapper2nd: {
    marginRight: -15,
    zIndex: 5,
  },
  officeStageWrapper3rd: {
    marginLeft: -15,
    zIndex: 5,
  },
  officeFloatingTrophyContainer: {
    position: "absolute",
    top: -98,
    zIndex: 20,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  officeFloatingTrophyImage: {
    width: 120,
    height: 120,
  },
  officeFloatingName: {
    position: "absolute",
    top: -180,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
    zIndex: 25,
    maxWidth: 140,
    marginBottom: 2,
  },
  officePointsContainer: {
    position: "absolute",
    top: -158,
    alignItems: "center",
    zIndex: 20,
    marginBottom: 2,
    gap: 2,
  },
  officeFloatingStats: {
    position: "absolute",
    top: -40,
    alignItems: "center",
    zIndex: 15,
  },
  officeFloatingStatsBelow: {
    position: "absolute",
    top: -140,
    alignItems: "center",
    zIndex: 15,
    gap: 4,
  },
  officeStage: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  officePoints: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 0,
  },
  officeUsername: {
    position: "absolute",
    top: -128,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    fontWeight: "500",
    zIndex: 15,
    marginBottom: 2,
  },
  officeJoinText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    fontWeight: "500",
  },
  officeRankContainer: {
    alignItems: "center",
  },
  officeRankText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 9999,
    width: '85%',
    maxWidth: 300,
  },
  tooltipBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.75)',
  },
  tooltipArrowLeft: {
    left: '25%',
  },
  tooltipArrowRight: {
    left: '75%',
  },
});

// Office Podium Component with stage-like design
const OfficePodium: React.FC<{ entries: LeaderboardEntry[] }> = ({
  entries,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const isTablet = screenWidth > 768;
  const isLargeDevice = screenWidth > 670;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipAcronym, setTooltipAcronym] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, arrowAlign: 'center' as 'left' | 'center' | 'right' });
  const [tooltipRank, setTooltipRank] = useState(1);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Auto-dismiss timer
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive scaling factors
  const getScaleFactor = () => {
    if (isTablet) return 1.3;
    if (isLargeDevice) return 1.1;
    if (screenWidth < 350) return 0.8;
    if (screenWidth < 400) return 0.9;
    return 1.0;
  };

  const scaleFactor = getScaleFactor();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const showTooltip = (officeName: string, index: number) => {
    const fullName = getOfficeFullName(officeName);
    setTooltipText(fullName);
    setTooltipAcronym(officeName);
    setTooltipRank(index + 1);
    
    // Calculate position based on podium index
    let xPos = screenWidth / 2; // Default center
    let arrowAlign: 'left' | 'center' | 'right' = 'center';
    
    if (index === 1) {
      // 2nd place - left side
      xPos = screenWidth * 0.25;
      arrowAlign = 'left';
    } else if (index === 0) {
      // 1st place - center
      xPos = screenWidth / 2;
      arrowAlign = 'center';
    } else if (index === 2) {
      // 3rd place - right side
      xPos = screenWidth * 0.75;
      arrowAlign = 'right';
    }
    
    const yPos = 150 * scaleFactor; // Position tooltip above podium
    
    setTooltipPosition({ x: xPos, y: yPos, arrowAlign });
    setTooltipVisible(true);
    
    // Haptic feedback (light vibration)
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(10);
    }
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-dismiss after 4 seconds
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      hideTooltip();
    }, 4000);
  };

  const hideTooltip = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTooltipVisible(false);
    });
  };
  const getOfficePodiumData = (index: number) => {
    switch (index) {
      case 0: // 1st Place - Center
        return {
          height: Math.round(60 * scaleFactor),
          width: Math.round(140 * scaleFactor),
          backgroundColor: "#FFD700",
          borderColor: "#FFA500",
          gradient: ["#FFD700", "#FFDB00", "#FFDF00", "#FFDB00", "#FFD700"], // Solid gold
          trophyImage: require("../../../../assets/images/trophies/gold_office.png"),
          rankText: "1st",
          rankColor: "#8B4513",
          pointsColor: "#FFD700", // Yellow Gold
        };
      case 1: // 2nd Place - Left
        return {
          height: Math.round(45 * scaleFactor),
          width: Math.round(120 * scaleFactor),
          backgroundColor: "#C0C0C0",
          borderColor: "#A0A0A0",
          gradient: ["#E8E8E8", "#EBEBEB", "#EFEFEF", "#EBEBEB", "#E8E8E8"], // Solid silver
          trophyImage: require("../../../../assets/images/trophies/silver_office.png"),
          rankText: "2nd",
          rankColor: "#4A5568",
          pointsColor: "#A9A9A9", // Darker Silver
        };
      case 2: // 3rd Place - Right
        return {
          height: Math.round(45 * scaleFactor),
          width: Math.round(120 * scaleFactor),
          backgroundColor: "#CD7F32",
          borderColor: "#B8860B",
          gradient: ["#D4976F", "#D99E74", "#DDA579", "#D99E74", "#D4976F"], // Solid bronze
          trophyImage: require("../../../../assets/images/trophies/bronze_office.png"),
          rankText: "3rd",
          rankColor: "#8B4513",
          pointsColor: "#D2691E", // Rust Orange
        };
      default:
        return {
          height: Math.round(150 * scaleFactor),
          width: Math.round(130 * scaleFactor),
          backgroundColor: "#E5E7EB",
          borderColor: "#D1D5DB",
          trophyImage: null,
          rankText: "N/A",
          rankColor: "#6B7280",
        };
    }
  };

  const OfficeStage = ({
    entry,
    index,
  }: {
    entry: LeaderboardEntry;
    index: number;
  }) => {
    const podiumData = getOfficePodiumData(index);
    const isEmpty = !entry.name;

    return (
      <TouchableOpacity
        activeOpacity={isEmpty ? 1 : 0.7}
        onPress={() => {
          if (!isEmpty) {
            showTooltip(entry.name, index);
          }
        }}
        disabled={isEmpty}
        style={[
          styles.officeStageWrapper,
          index === 1 && styles.officeStageWrapper2nd,
          index === 2 && styles.officeStageWrapper3rd,
        ]}
      >
        {/* Office Name / "# Place" */}
        <Text
          style={[
            styles.officeFloatingName,
            {
              color: "#000000",
              fontSize: 18 * scaleFactor,
              top: -180 * scaleFactor,
            },
            index !== 0 && { top: -160 * scaleFactor },
          ]}
          numberOfLines={2}
        >
          {isEmpty
            ? index === 0
              ? "1st Place"
              : index === 1
              ? "2nd Place"
              : "3rd Place"
            : entry.name}
        </Text>

        {/* Points / "Join the Competition" */}
        <View
          style={[
            styles.officePointsContainer,
            { top: -158 * scaleFactor },
            index !== 0 && { top: -135 * scaleFactor },
          ]}
        >
          {!isEmpty ? (
            <Text
              style={[
                styles.officePoints,
                {
                  color: podiumData.pointsColor,
                  fontSize: 20 * scaleFactor,
                },
              ]}
            >
              {entry.points || 0} pts
            </Text>
          ) : (
            <Text
              style={[
                styles.officeJoinText,
                {
                  color: "rgba(0, 0, 0, 0.6)",
                  fontSize: 14 * scaleFactor,
                },
              ]}
            >
              {index === 0 ? "Be the first!" : "Join the competition"}
            </Text>
          )}
        </View>

        {/* Username */}
        {!isEmpty ? (
          <Text
            style={[
              styles.officeUsername,
              {
                color: "rgba(0, 0, 0, 0.8)",
                fontSize: 14 * scaleFactor,
                top: -128 * scaleFactor,
              },
              index !== 0 && { top: -105 * scaleFactor },
            ]}
          >
            @{entry.name.toLowerCase().replace(/\s+/g, "")}
          </Text>
        ) : null}

        {/* Trophy Image */}
        <View
          style={[
            styles.officeFloatingTrophyContainer,
            {
              top: -98 * scaleFactor,
              width: 100 * scaleFactor,
              height: 100 * scaleFactor,
            },
          ]}
        >
          {isEmpty ? (
            <Ionicons
              name="business-outline"
              size={60 * scaleFactor}
              color="rgba(255, 255, 255, 0.9)"
            />
          ) : (
            <Image
              source={podiumData.trophyImage}
              style={[
                styles.officeFloatingTrophyImage,
                {
                  width: 120 * scaleFactor,
                  height: 120 * scaleFactor,
                },
                index !== 0 && {
                  width: 100 * scaleFactor,
                  height: 100 * scaleFactor,
                  marginTop: 20 * scaleFactor,
                },
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Small Stage Box - Just for Rank Label */}
        <LinearGradient
          colors={podiumData.gradient as [string, string, ...string[]]}
          style={[
            styles.officeStage,
            {
              height: podiumData.height,
              width: podiumData.width,
              zIndex: index === 0 ? 10 : 1,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Only Rank Number in Box */}
          <View style={styles.officeRankContainer}>
            <Text
              style={[
                styles.officeRankText,
                {
                  color: podiumData.rankColor,
                  fontSize: 16 * scaleFactor,
                },
              ]}
            >
              {podiumData.rankText}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.officePodiumContainer}>
      <View
        style={[
          styles.officePodiumWrapper,
          {
            paddingTop: 160 * scaleFactor,
            paddingHorizontal: 16 * scaleFactor,
          },
        ]}
      >
        {/* 2nd Place - Left */}
        <OfficeStage entry={entries[1]} index={1} />

        {/* 1st Place - Center */}
        <OfficeStage entry={entries[0]} index={0} />

        {/* 3rd Place - Right */}
        <OfficeStage entry={entries[2]} index={2} />
      </View>

      {/* Simple Tooltip Modal */}
      <Modal
        visible={tooltipVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideTooltip}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={hideTooltip}
        >
          <Animated.View 
            style={[
              styles.tooltipContainer, 
              { 
                top: tooltipPosition.y,
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ]
              }
            ]}
          >
            <View style={styles.tooltipBubble}>
              {/* Full Office Name */}
              <Text style={styles.tooltipText}>{tooltipText}</Text>
              
              {/* Arrow */}
              <View style={[
                styles.tooltipArrow,
                tooltipPosition.arrowAlign === 'left' && styles.tooltipArrowLeft,
                tooltipPosition.arrowAlign === 'right' && styles.tooltipArrowRight,
              ]} />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
