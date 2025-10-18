import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
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

// --- Helper Functions (No changes here) ---
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
// --- End Helper Functions ---

// --- Redesigned Components ---

// Retained from the last creative design
function IncidentCard({
  incident,
  onPress,
}: {
  incident: IncidentResponseDto;
  onPress: () => void;
}) {
  const status = getStatusInfo(incident.status);
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

        <View className="flex-row items-center mb-4">
          <Ionicons name="location-outline" size={16} color="#8B0000" />
          <Text className="text-gray-600 ml-2 flex-1 text-sm" numberOfLines={1}>
            {incident.location}
          </Text>
        </View>

        <View className="flex-row justify-end items-center border-t border-gray-100 pt-3">
          <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
          <Text className="ml-1 text-gray-600 font-medium text-sm">
            {incident.upvoteCount || 0} Upvotes
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// This is the restored StatCard design from the previous version
function StatCard({
  title,
  count,
  icon,
  iconTint,
  onPress,
  isActive = false,
  isTablet = false,
}: {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  onPress?: () => void;
  isActive?: boolean;
  isTablet?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`flex-1 rounded-xl transition-all duration-200`}
      style={{
        backgroundColor: isActive ? "#8B00001A" : "#FFFFFF",
        borderWidth: 1,
        borderColor: isActive ? iconTint : "#F3F4F6",
        padding: isTablet ? 12 : 8,
      }}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="items-start">
        <View
          className="rounded-full items-center justify-center mb-1"
          style={{
            backgroundColor: `${iconTint}25`,
            width: isTablet ? 32 : 24,
            height: isTablet ? 32 : 24,
          }}
        >
          <Ionicons name={icon} size={isTablet ? 16 : 12} color={iconTint} />
        </View>
        <Text
          className="font-bold"
          style={{
            color: isActive ? iconTint : "#111827",
            fontSize: isTablet ? 24 : 18,
          }}
        >
          {count}
        </Text>
        <Text
          className="font-medium"
          style={{
            color: isActive ? iconTint : "#6B7280",
            fontSize: isTablet ? 12 : 10,
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

  // --- Logic and Data Fetching (No changes here) ---
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
    if (!activeFilter || activeFilter === "all") return myIncidents;
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
  // --- End Logic and Data Fetching ---

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ title: "Home" }} />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text className="text-[#8B0000] mt-2">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
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
      >
        {/* Overview Stats with restored card design */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-xl text-gray-800">
              Reports Overview
            </Text>
            {activeFilter && (
              <TouchableOpacity
                onPress={clearFilter}
                className="flex-row items-center bg-gray-200 py-1 px-2 rounded-full"
              >
                <Ionicons name="close" size={12} color="#4B5563" />
                <Text className="text-gray-700 ml-1 text-xs font-medium">
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row" style={{ columnGap: isTablet ? 12 : 8 }}>
            <StatCard
              title="Total Reports"
              count={myIncidents.length}
              icon="file-tray-full-outline"
              iconTint="#8B0000" // Maroon
              onPress={() => handleFilterPress("all")}
              isActive={activeFilter === "all"}
              isTablet={isTablet}
            />
            <StatCard
              title="Pending"
              count={
                myIncidents.filter(
                  (i) => (i.status || "").toLowerCase() === "pending"
                ).length
              }
              icon="hourglass-outline"
              iconTint="#D97706" // Gold/Amber
              onPress={() => handleFilterPress("pending")}
              isActive={activeFilter === "pending"}
              isTablet={isTablet}
            />
            <StatCard
              title="In Progress"
              count={
                myIncidents.filter((i) =>
                  (i.status || "").toLowerCase().includes("in progress")
                ).length
              }
              icon="sync-outline"
              iconTint="#1976D2" // Blue
              onPress={() => handleFilterPress("in_progress")}
              isActive={activeFilter === "in_progress"}
              isTablet={isTablet}
            />
            <StatCard
              title="Resolved"
              count={
                myIncidents.filter((i) =>
                  (i.status || "").toLowerCase().includes("resolved")
                ).length
              }
              icon="checkmark-done-outline"
              iconTint="#16A34A" // Green
              onPress={() => handleFilterPress("resolved")}
              isActive={activeFilter === "resolved"}
              isTablet={isTablet}
            />
          </View>
        </View>

        {/* My Incidents Header - Retained from creative design */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-bold text-xl text-gray-800">My Reports</Text>
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

      {/* Notifications Modal (Untouched as requested) */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              borderRadius: 12,
              margin: 8,
              marginTop: 100,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
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
                style={{ fontWeight: "600", fontSize: 16, color: "#333333" }}
              >
                Notifications
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ padding: 8, marginRight: 8 }}
                  onPress={fetchNotifications}
                >
                  <Ionicons name="refresh" size={18} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={markAllNotificationsAsRead}>
                  <Text style={{ color: "#666666", fontSize: 14 }}>
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
                <Text style={{ color: "#666666", fontSize: 14 }}>
                  No notifications
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 400 }}
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
                      backgroundColor: !n.isRead ? "#F8F8F8" : "transparent",
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
                            fontWeight: "500",
                            fontSize: 14,
                            color: "#333333",
                          }}
                        >
                          {n.activityType || "Update"}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#666666" }}>
                          {n.createdAt}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#666666",
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
                  style={{ color: "#8B0000", fontWeight: "500", fontSize: 14 }}
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
