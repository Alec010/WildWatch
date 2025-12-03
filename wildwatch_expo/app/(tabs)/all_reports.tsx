import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { incidentAPI } from "../../src/features/incidents/api/incident_api";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { CircularLoader } from "../../components/CircularLoader";
import { sanitizeLocation } from "../../src/utils/locationUtils";

// --- Helper Functions ---
function getStatusInfo(status?: string | null) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized.includes("in progress"))
    return {
      color: "#1976D2",
      bgColor: "#EFF6FF",
      text: "In Progress",
      icon: "sync-circle" as const,
    };
  if (normalized.includes("resolved"))
    return {
      color: "#16A34A",
      bgColor: "#F0FDF4",
      text: "Resolved",
      icon: "checkmark-circle" as const,
    };
  if (normalized.includes("urgent"))
    return {
      color: "#DC2626",
      bgColor: "#FEF2F2",
      text: "Urgent",
      icon: "warning" as const,
    };
  return {
    color: "#D97706",
    bgColor: "#FFFBEB",
    text: "Pending",
    icon: "hourglass" as const,
  };
}

function formatRelative(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 36e5);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatLocationShort(location?: string | null): string {
  const sanitized = sanitizeLocation(location);
  if (!sanitized) return "Location not specified";
  const parts = sanitized.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || sanitized;
}

function openInGoogleMaps(location?: string | null) {
  if (!location) return;
  const query = sanitizeLocation(location) || location;
  const encodedLocation = encodeURIComponent(query);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  Linking.openURL(url).catch((err) =>
    console.error("Failed to open maps:", err)
  );
}
// --- End Helper Functions ---

// --- Components ---
function IncidentCard({
  incident,
  onPress,
}: {
  incident: IncidentResponseDto;
  onPress: () => void;
}) {
  const status = getStatusInfo(incident.status);
  const upvotes = incident.upvoteCount || 0;
  const hasUpvotes = upvotes > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl mb-4 border border-gray-100"
      style={{
        shadowColor: "#4A0404",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
      }}
      accessibilityRole="button"
    >
      <View
        className="px-4 py-3 rounded-t-xl flex-row justify-between items-center"
        style={{ backgroundColor: status.bgColor }}
      >
        <View className="flex-row items-center">
          <Ionicons name={status.icon} size={16} color={status.color} />
          <Text
            className="font-bold ml-2 text-sm"
            style={{ color: status.color }}
          >
            {status.text}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text className="text-gray-500 ml-1 text-xs">
            {formatRelative(incident.submittedAt as any)}
          </Text>
        </View>
      </View>

      <View className="p-4">
        <Text
          className="font-bold text-base text-gray-800 mb-2"
          numberOfLines={1}
        >
          {incident.incidentType}
        </Text>

        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={() => openInGoogleMaps(incident.location)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={16} color="#8B0000" />
          <Text
            className="text-gray-600 ml-2 flex-1 text-sm underline"
            numberOfLines={1}
          >
            {formatLocationShort(incident.location)}
          </Text>
        </TouchableOpacity>

        <Text
          className="text-gray-500 text-sm mb-4"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {incident.description}
        </Text>

        <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
          <View className="flex-row items-center">
            <View
              style={{
                backgroundColor: hasUpvotes ? "#FEF3C7" : "#F3F4F6",
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={hasUpvotes ? "thumbs-up" : "thumbs-up-outline"}
                size={14}
                color={hasUpvotes ? "#F4C430" : "#6B7280"}
              />
              <Text
                className="ml-1 font-medium text-xs"
                style={{ color: hasUpvotes ? "#92400E" : "#6B7280" }}
              >
                {upvotes} {upvotes === 1 ? "Upvote" : "Upvotes"}
              </Text>
            </View>
          </View>
          <Text className="text-[#8B0000] font-semibold text-sm">
            View Details
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --- End Components ---

export default function AllReportsScreen() {
  const [myIncidents, setMyIncidents] = useState<IncidentResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterButtonRef = React.useRef<any>(null);
  const screenWidth = Dimensions.get("window").width;
  const isTablet = screenWidth >= 768;

  const fetchData = async () => {
    setError(null);
    try {
      const mine = await incidentAPI.getMyIncidents();
      setMyIncidents(mine);
    } catch (e: any) {
      setError(e?.message || "Failed to load incidents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterSelect = (filterType: string) => {
    setActiveFilter(filterType);
    setShowFilterModal(false);
  };

  const handleFilterPress = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          setFilterButtonLayout({ x, y, width, height });
          setShowFilterModal(true);
        }
      );
    } else {
      setShowFilterModal(true);
    }
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case "all":
        return "All Reports";
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return "All Reports";
    }
  };

  const getFilterIcon = () => {
    switch (activeFilter) {
      case "pending":
        return { icon: "hourglass-outline" as const, color: "#D97706" };
      case "in_progress":
        return { icon: "sync-outline" as const, color: "#1976D2" };
      case "resolved":
        return { icon: "checkmark-done-outline" as const, color: "#16A34A" };
      default:
        return { icon: "file-tray-full-outline" as const, color: "#8B0000" };
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const visibleIncidents = useMemo(() => {
    if (activeFilter === "all") return myIncidents;
    return myIncidents.filter((incident) => {
      const status = (incident.status || "").toLowerCase();
      switch (activeFilter) {
        case "pending":
          return status === "pending";
        case "in_progress":
          return status.includes("in progress");
        case "resolved":
          return status.includes("resolved");
        default:
          return true;
      }
    });
  }, [myIncidents, activeFilter]);

  const filterOptions = [
    {
      key: "all",
      label: "All Reports",
      icon: "file-tray-full-outline" as const,
      color: "#8B0000",
      count: myIncidents.length,
    },
    {
      key: "pending",
      label: "Pending",
      icon: "hourglass-outline" as const,
      color: "#D97706",
      count: myIncidents.filter(
        (i) => (i.status || "").toLowerCase() === "pending"
      ).length,
    },
    {
      key: "in_progress",
      label: "In Progress",
      icon: "sync-outline" as const,
      color: "#1976D2",
      count: myIncidents.filter((i) =>
        (i.status || "").toLowerCase().includes("in progress")
      ).length,
    },
    {
      key: "resolved",
      label: "Resolved",
      icon: "checkmark-done-outline" as const,
      color: "#16A34A",
      count: myIncidents.filter((i) =>
        (i.status || "").toLowerCase().includes("resolved")
      ).length,
    },
  ];

  if (loading) {
    return (
      <View className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <CircularLoader subtitle="Loading all reports..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top App Bar - Matching Dashboard Header Size */}
      <View
        style={{
          backgroundColor: "#8B0000",
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 18,
          borderBottomWidth: 0,
        }}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/dashboard" as never)}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-xl">All Reports</Text>
        </View>
      </View>
      {/* End Top App Bar */}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Filter and Header */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-xl text-gray-800">My Reports</Text>
            <TouchableOpacity
              ref={filterButtonRef}
              onPress={handleFilterPress}
              className="flex-row items-center justify-between bg-white rounded-lg pl-3 pr-2 py-2"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                minWidth: 180,
                gap: 8,
              }}
            >
              <View
                className="flex-row items-center flex-1"
                style={{ minWidth: 0 }}
              >
                <Ionicons
                  name={getFilterIcon().icon}
                  size={16}
                  color={getFilterIcon().color}
                />
                <Text
                  className="font-medium text-sm text-gray-700 ml-2"
                  numberOfLines={1}
                >
                  {getFilterLabel()}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#6B7280"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-sm mt-2">
            {visibleIncidents.length} total
          </Text>
        </View>

        {error && (
          <View className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 text-center font-medium">
              {error}
            </Text>
          </View>
        )}

        {visibleIncidents.length === 0 ? (
          <View className="bg-white rounded-lg p-10 items-center mt-4 border border-dashed border-gray-300">
            <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4 text-center font-semibold text-base">
              No Reports Found
            </Text>
            <Text className="text-gray-400 mt-1 text-center text-sm">
              {activeFilter
                ? `You have no "${activeFilter.replace("_", " ")}" reports.`
                : "Submit a new report to see it here."}
            </Text>
          </View>
        ) : (
          <View
            className="flex-row flex-wrap"
            style={{
              marginHorizontal: isTablet ? -6 : 0,
            }}
          >
            {visibleIncidents.map((incident) => (
              <View
                key={incident.id}
                style={{
                  width: isTablet ? "50%" : "100%",
                  paddingHorizontal: isTablet ? 6 : 0,
                }}
              >
                <IncidentCard
                  incident={incident}
                  onPress={() =>
                    router.push(`/case/${incident.trackingNumber}` as never)
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Dropdown */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "transparent",
          }}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View
            style={{
              position: "absolute",
              top: filterButtonLayout
                ? filterButtonLayout.y + filterButtonLayout.height + 4
                : 155,
              right: 16,
              width: filterButtonLayout ? filterButtonLayout.width : 180,
              minWidth: 180,
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              paddingVertical: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => handleFilterSelect(option.key)}
                className="flex-row items-center justify-between px-3 py-2.5"
                style={{
                  backgroundColor:
                    activeFilter === option.key ? "#8B00000D" : "transparent",
                  borderBottomWidth: index < filterOptions.length - 1 ? 1 : 0,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  className="flex-row items-center flex-1"
                  style={{ minWidth: 0 }}
                >
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={option.color}
                    style={{ marginRight: 8, flexShrink: 0 }}
                  />
                  <Text
                    className="font-medium text-sm"
                    numberOfLines={1}
                    style={{
                      color:
                        activeFilter === option.key ? option.color : "#374151",
                      fontWeight: activeFilter === option.key ? "600" : "400",
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View
                    className="rounded-full px-1.5 py-0.5"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <Text
                      className="font-semibold text-xs"
                      style={{ color: option.color }}
                    >
                      {option.count}
                    </Text>
                  </View>
                  {activeFilter === option.key && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={option.color}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
