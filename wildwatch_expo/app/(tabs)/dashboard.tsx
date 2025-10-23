import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { incidentAPI } from "../../src/features/incidents/api/incident_api";
import { config } from "../../lib/config";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { CircularLoader } from "../../components/CircularLoader";

// --- Helper Functions (No changes here) ---
function getStatusInfo(status?: string | null) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized.includes("in progress"))
    return {
      color: "#1D4ED8",
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
  if (!location) return "N/A";
  const parts = location.split(",").map((p) => p.trim());
  const plusCodeRegex = /^[A-Z0-9]{4}\+[A-Z0-9]{2,}/;
  if (plusCodeRegex.test(parts[0])) {
    const barangay = parts.length > 1 ? parts[1] : "";
    return barangay ? `${parts[0]}, ${barangay}` : parts[0];
  }
  return parts[0];
}

function openInGoogleMaps(location?: string | null) {
  if (!location) return;
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  Linking.openURL(url).catch((err) =>
    console.error("Failed to open maps:", err)
  );
}
// --- End Helper Functions ---

// --- Redesigned Components (visual-only changes) ---

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
      className="bg-white rounded-2xl mb-4 border"
      style={{
        borderColor: "#E5E7EB",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        height: 240,
        flexDirection: "column",
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {/* Status strip */}
      <View
        className="px-4 py-3 rounded-t-2xl flex-row justify-between items-center"
        style={{
          backgroundColor: status.bgColor,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: `${status.color}22`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text
              className="font-semibold ml-1 text-xs"
              style={{ color: status.color }}
            >
              {status.text}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text className="text-gray-500 ml-1 text-xs">
            {formatRelative(incident.submittedAt as any)}
          </Text>
        </View>
      </View>

      <View className="p-4" style={{ flex: 1, flexDirection: "column" }}>
        <View style={{ flex: 1 }}>
          <Text
            className="font-extrabold text-lg text-gray-900 tracking-tight mb-2"
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
              className="text-gray-700 ml-2 flex-1 text-sm underline"
              numberOfLines={1}
            >
              {formatLocationShort(incident.location)}
            </Text>
          </TouchableOpacity>

          <Text
            className="text-gray-600 text-sm leading-5"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {incident.description}
          </Text>
        </View>

        <View
          className="flex-row justify-between items-center border-t pt-3"
          style={{ borderColor: "#F3F4F6" }}
        >
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
          <View className="flex-row items-center">
            <Text className="text-[#8B0000] font-semibold text-sm">
              View Details
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#8B0000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({
  title,
  count,
  icon,
  iconTint,
  onPress,
  isActive = false,
  isTablet = false,
  isSmallDevice = false,
}: {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  onPress?: () => void;
  isActive?: boolean;
  isTablet?: boolean;
  isSmallDevice?: boolean;
}) {
  const getPadding = () => {
    if (isTablet) return 14;
    if (isSmallDevice) return 8;
    return 10;
  };
  const getIconSize = () => {
    if (isTablet) return { container: 40, icon: 20 };
    if (isSmallDevice) return { container: 28, icon: 14 };
    return { container: 32, icon: 16 };
  };
  const getCountFontSize = () => {
    if (isTablet) return 26;
    if (isSmallDevice) return 16;
    return 20;
  };
  const getTitleFontSize = () => {
    if (isTablet) return 13;
    if (isSmallDevice) return 10;
    return 11;
  };
  const iconSizes = getIconSize();
  return (
    <TouchableOpacity
      className={`flex-1 rounded-2xl`}
      style={{
        backgroundColor: isActive ? "#FFF7F7" : "#FFFFFF",
        padding: getPadding(),
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
      }}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
    >
      <View className="items-start">
        <View
          className="rounded-full items-center justify-center"
          style={{
            backgroundColor: `${iconTint}22`,
            width: iconSizes.container,
            height: iconSizes.container,
            marginBottom: isSmallDevice ? 6 : 8,
          }}
        >
          <Ionicons name={icon} size={iconSizes.icon} color={iconTint} />
        </View>
        <Text
          className="font-extrabold"
          style={{
            color: isActive ? iconTint : "#0F172A",
            fontSize: getCountFontSize(),
            letterSpacing: -0.2,
          }}
        >
          {count}
        </Text>
        <Text
          className="font-medium"
          style={{
            color: isActive ? iconTint : "#6B7280",
            fontSize: getTitleFontSize(),
            marginTop: 2,
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// --- Main Dashboard Screen ---

export default function DashboardScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [myIncidents, setMyIncidents] = useState<IncidentResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] =
    useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const isTablet = screenWidth >= 768;
  const isSmallDevice = screenWidth < 670;

  // --- Logic and Data Fetching (unchanged) ---
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

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await api.get(`${config.API.BASE_URL}/activity-logs`, {
        params: { page: 0, size: 10 },
      });
      const data = res.data;
      const content = Array.isArray(data?.content) ? data.content : [];
      setNotifications(content);
      setHasUnread(content.some((n: any) => !n.isRead));
    } catch (err: any) {
      setNotificationsError(err?.message || "Failed to fetch notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.put(`/activity-logs/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setHasUnread((prev) => notifications.some((n) => !n.isRead));
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put(`/activity-logs/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch {}
  };

  const handleFilterPress = (filterType: string) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const clearFilter = () => setActiveFilter(null);

  useEffect(() => {
    setLoading(true);
    fetchData();
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      fetchNotifications();
    }, [])
  );

  const visibleIncidents = useMemo(() => {
    let filtered = myIncidents;
    if (activeFilter && activeFilter !== "all") {
      filtered = myIncidents.filter((incident) => {
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
    }
    return filtered.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [myIncidents, activeFilter]);

  const displayLimit = isTablet ? 10 : 6;
  const displayedIncidents = visibleIncidents.slice(0, displayLimit);
  const hasMoreIncidents = visibleIncidents.length > displayLimit;
  // --- End Logic and Data Fetching ---

  if (loading) {
    return (
      <View className="flex-1">
        <Stack.Screen options={{ title: "Home" }} />
        <CircularLoader subtitle="Loading your reports..." />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#F7F7FB" }}>
      <Stack.Screen options={{ title: "Home" }} />

      {/* Top App Bar (Untouched as requested) */}
      <View
        style={{
          backgroundColor: "#8B0000",
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 0,
        }}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/images/logos/logo2.png")}
            style={{
              width: 100,
              height: 100,
              marginTop: -25,
              marginBottom: -25,
            }}
            resizeMode="contain"
          />
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="relative"
            style={{ padding: 8, marginLeft: 16 }}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications" size={28} color="#FFFFFF" />
            {hasUnread && (
              <View
                className="absolute rounded-full bg-yellow-400"
                style={{
                  top: 6,
                  right: 6,
                  width: 10,
                  height: 10,
                  borderWidth: 1,
                  borderColor: "#8B0000",
                }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="relative"
            style={{ padding: 8 }}
            onPress={() => router.push("/profile" as never)}
          >
            <Ionicons name="person-circle" size={30} color="#FFFFFF" />
          </TouchableOpacity>
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
              fetchNotifications();
            }}
          />
        }
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="font-extrabold text-gray-900 tracking-tight"
              style={{ fontSize: isSmallDevice ? 18 : 24 }}
            >
              Reports Overview
            </Text>
            {activeFilter && (
              <TouchableOpacity
                onPress={clearFilter}
                className="flex-row items-center py-1 px-2 rounded-full"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <Ionicons name="close" size={12} color="#4B5563" />
                <Text className="text-gray-700 ml-1 text-xs font-medium">
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            className="flex-row"
            style={{ columnGap: isSmallDevice ? 6 : isTablet ? 12 : 8 }}
          >
            <StatCard
              title="Total Reports"
              count={myIncidents.length}
              icon="file-tray-full-outline"
              iconTint="#8B0000"
              onPress={() => handleFilterPress("all")}
              isActive={activeFilter === "all"}
              isTablet={isTablet}
              isSmallDevice={isSmallDevice}
            />
            <StatCard
              title="Pending"
              count={
                myIncidents.filter(
                  (i) => (i.status || "").toLowerCase() === "pending"
                ).length
              }
              icon="hourglass-outline"
              iconTint="#D97706"
              onPress={() => handleFilterPress("pending")}
              isActive={activeFilter === "pending"}
              isTablet={isTablet}
              isSmallDevice={isSmallDevice}
            />
            <StatCard
              title="In Progress"
              count={
                myIncidents.filter((i) =>
                  (i.status || "").toLowerCase().includes("in progress")
                ).length
              }
              icon="sync-outline"
              iconTint="#1D4ED8"
              onPress={() => handleFilterPress("in_progress")}
              isActive={activeFilter === "in_progress"}
              isTablet={isTablet}
              isSmallDevice={isSmallDevice}
            />
            <StatCard
              title="Resolved"
              count={
                myIncidents.filter((i) =>
                  (i.status || "").toLowerCase().includes("resolved")
                ).length
              }
              icon="checkmark-done-outline"
              iconTint="#16A34A"
              onPress={() => handleFilterPress("resolved")}
              isActive={activeFilter === "resolved"}
              isTablet={isTablet}
              isSmallDevice={isSmallDevice}
            />
          </View>
        </View>

        {/* My Incidents Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="font-extrabold text-gray-900 tracking-tight"
            style={{ fontSize: isSmallDevice ? 18 : 24 }}
          >
            My Reports
          </Text>
          {myIncidents.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/all_reports" as never)}
              className="flex-row items-center"
              activeOpacity={0.85}
            >
              <Text className="text-[#8B0000] font-semibold text-sm mr-1">
                View all
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#8B0000" />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-red-700 text-center font-medium">
              {error}
            </Text>
          </View>
        )}

        {visibleIncidents.length === 0 ? (
          <View
            className="bg-white rounded-2xl p-10 items-center mt-4 border border-dashed"
            style={{ borderColor: "#D1D5DB" }}
          >
            <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-700 mt-4 text-center font-semibold text-base">
              No Reports Found
            </Text>
            <Text className="text-gray-500 mt-1 text-center text-sm">
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
            {displayedIncidents.map((incident) => (
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

      {/* Notifications Modal (visual polish only) */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-start",
            alignItems: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View
            style={{
              width: 320,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              margin: 8,
              marginTop: 100,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#EEEEEE",
              }}
            >
              <Text
                style={{ fontWeight: "700", fontSize: 16, color: "#111827" }}
              >
                Notifications
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ padding: 8, marginRight: 8 }}
                  onPress={fetchNotifications}
                >
                  <Ionicons name="refresh" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={markAllNotificationsAsRead}>
                  <Text style={{ color: "#6B7280", fontSize: 14 }}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {notificationsLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#8B0000" />
              </View>
            ) : notificationsError ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#8B0000", fontSize: 14 }}>
                  {notificationsError}
                </Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                  No notifications
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: !n.isRead ? "#F9FAFB" : "transparent",
                    }}
                    onPress={() => {
                      markNotificationAsRead(n.id);
                      if (n.incident?.trackingNumber) {
                        setShowNotifications(false);
                        router.push(
                          `/case/${n.incident.trackingNumber}` as never
                        );
                      }
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#8B0000",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name="notifications"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "600",
                            fontSize: 14,
                            color: "#111827",
                          }}
                        >
                          {n.activityType || "Update"}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          {n.createdAt}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          lineHeight: 18,
                        }}
                        numberOfLines={2}
                      >
                        {n.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#EEEEEE",
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowNotifications(false);
                  router.push("/notifications" as never);
                }}
              >
                <Text
                  style={{ color: "#8B0000", fontWeight: "600", fontSize: 14 }}
                >
                  View All Notifications
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
