import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Linking,
  Image,
  Modal,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { usePublicIncidents } from "../../src/features/incidents/hooks/usePublicIncidents";
import { CircularLoader } from "../../components/CircularLoader";
import { useBulletins } from "../../src/features/bulletins/hooks/useBulletins";
import type { OfficeBulletinDto } from "../../src/features/bulletins/models/BulletinModels";
import { bulletinAPI } from "../../src/features/bulletins/api/bulletin_api";
import { useBulletinUpvoteStatus } from "../../src/features/bulletins/hooks/useBulletinUpvoteStatus";
import { storage } from "../../lib/storage";
import { config } from "../../lib/config";
import { useOffices } from "../../src/features/offices/hooks/useOffices";

// Media Viewer Component
interface MediaViewerProps {
  visible: boolean;
  mediaUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  mediaUrl,
  fileName,
  fileType,
  onClose,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    try {
      // Open the media URL in browser which will trigger download
      await Linking.openURL(mediaUrl);
      Toast.show({
        type: "success",
        text1: "Opening download...",
        text2: "File will be downloaded by your browser",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to open download",
        text2: "Please try again",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const resetViewer = () => {
    setRotation(0);
    setScale(1);
  };

  useEffect(() => {
    if (!visible) {
      resetViewer();
    }
  }, [visible]);

  const isImage = fileType?.startsWith("image/");

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header Controls */}
        <View style={styles.header}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isImage ? (
            <Image
              source={{ uri: mediaUrl }}
              style={{
                width: "100%",
                height: "100%",
                transform: [{ rotate: `${rotation}deg` }, { scale }],
              }}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.documentView}>
              <Ionicons name="document-text" size={100} color="#6B7280" />
              <Text style={styles.documentText}>{fileName}</Text>
              <Text style={styles.documentSubtext}>
                Tap download to save or open externally
              </Text>
              <TouchableOpacity
                style={styles.openExternalButton}
                onPress={() => Linking.openURL(mediaUrl)}
              >
                <Ionicons name="open-outline" size={20} color="#FFF" />
                <Text style={styles.openExternalText}>Open Externally</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer Controls */}
        <View style={styles.footer}>
          {isImage && (
            <>
              <TouchableOpacity
                onPress={handleZoomOut}
                style={styles.controlButton}
              >
                <Ionicons name="remove-circle-outline" size={32} color="#FFF" />
                <Text style={styles.controlLabel}>Zoom Out</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleZoomIn}
                style={styles.controlButton}
              >
                <Ionicons name="add-circle-outline" size={32} color="#FFF" />
                <Text style={styles.controlLabel}>Zoom In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRotate}
                style={styles.controlButton}
              >
                <Ionicons name="sync-outline" size={32} color="#FFF" />
                <Text style={styles.controlLabel}>Rotate</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.controlButton}
          >
            <Ionicons name="download-outline" size={32} color="#FFF" />
            <Text style={styles.controlLabel}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  fileName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  documentView: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  documentText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  documentSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  openExternalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B0000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  openExternalText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  controlButton: {
    alignItems: "center",
    padding: 8,
  },
  controlLabel: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 4,
  },
});

// Bulletin Card Component with Upvote
interface BulletinCardProps {
  bulletin: OfficeBulletinDto;
  isTwoColumnLayout: boolean;
  screenWidth: number;
  onRelatedIncidentClick: (trackingNumber?: string) => void;
  formatDate: (dateString?: string | null) => string;
  onUpvoteSuccess: () => void;
}

const BulletinCard: React.FC<BulletinCardProps> = ({
  bulletin,
  isTwoColumnLayout,
  screenWidth,
  onRelatedIncidentClick,
  formatDate,
  onUpvoteSuccess,
}) => {
  const { hasUpvoted, setHasUpvoted, refetchUpvoteStatus } =
    useBulletinUpvoteStatus(bulletin.id);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [upvoteCount, setUpvoteCount] = useState<number>(
    bulletin.upvoteCount || 0
  );

  // Fetch upvote count from API endpoint
  const fetchUpvoteCount = async () => {
    try {
      const response = await fetch(
        `${config.API.BASE_URL}/office-bulletins/${bulletin.id}/upvote-count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await storage.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const count = await response.json();
        setUpvoteCount(
          typeof count === "number"
            ? count
            : count.count || count.upvoteCount || 0
        );
      }
    } catch (error) {
      console.error("Error fetching upvote count:", error);
    }
  };

  // Fetch upvote count on mount and when bulletin changes
  useEffect(() => {
    fetchUpvoteCount();
  }, [bulletin.id]);

  const handleUpvote = async () => {
    try {
      const token = await storage.getToken();
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Please login to upvote",
          position: "bottom",
          visibilityTime: 2000,
        });
        return;
      }

      await bulletinAPI.upvoteBulletin(bulletin.id);
      const wasUpvoted = !hasUpvoted;
      setHasUpvoted(wasUpvoted);

      Toast.show({
        type: "success",
        text1: wasUpvoted
          ? "Upvoted Successfully!"
          : "Removed Upvote Successfully!",
        position: "bottom",
        visibilityTime: 2000,
      });

      // Refresh upvote status and bulletin data to get updated count
      await refetchUpvoteStatus();
      await fetchUpvoteCount();
      onUpvoteSuccess();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update upvote",
        text2: "Please try again",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View
      key={bulletin.id}
      className="bg-white rounded-2xl border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        width: isTwoColumnLayout ? "48%" : "100%",
        marginBottom: isTwoColumnLayout ? 0 : 12,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Content Area */}
      <View className="p-4 flex-1">
        {/* Header */}
        <View className="flex-row items-start mb-2">
          <View className="bg-[#8B0000]/10 p-2 rounded-xl mr-3">
            <Ionicons name="megaphone" size={20} color="#8B0000" />
          </View>
          <View className="flex-1">
            <Text
              className="font-extrabold text-gray-900 text-[17px]"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {bulletin.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#6B7280"
              />
              <Text
                className="text-gray-500 text-xs ml-1 mr-1"
                numberOfLines={1}
              >
                {bulletin.createdBy.replace(/ Admin$/i, "")}
              </Text>
              <Text className="text-gray-300 mx-1">•</Text>
              <Text className="text-gray-500 text-xs">
                {formatDate(bulletin.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <Text
          className="text-gray-700 text-[13px] leading-5 mb-3"
          numberOfLines={4}
          ellipsizeMode="tail"
        >
          {bulletin.description}
        </Text>

        {/* Related Reports */}
        {bulletin.relatedIncidents && bulletin.relatedIncidents.length > 0 && (
          <View className="mb-3">
            <Text className="text-[11px] font-semibold text-gray-600 mb-2">
              Related Reports ({bulletin.relatedIncidents.length}):
            </Text>
            <View className="flex-row flex-wrap">
              {bulletin.relatedIncidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  className="bg-green-50 border border-green-200 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                  onPress={() =>
                    onRelatedIncidentClick(incident.trackingNumber)
                  }
                >
                  <Ionicons name="link" size={10} color="#15803D" />
                  <Text className="text-green-700 text-[11px] font-semibold ml-1">
                    #{incident.trackingNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Media */}
        {bulletin.mediaAttachments && bulletin.mediaAttachments.length > 0 && (
          <View className="mb-1">
            <Text className="text-[11px] font-semibold text-gray-600 mb-2">
              Attachments ({bulletin.mediaAttachments.length}):
            </Text>
            <View className="flex-row flex-wrap">
              {bulletin.mediaAttachments.map((media) => {
                const isImage = media.fileType?.startsWith("image/");
                if (isImage) {
                  return (
                    <TouchableOpacity
                      key={media.id}
                      className="mb-2"
                      onPress={() =>
                        setSelectedMedia({
                          url: media.fileUrl,
                          fileName: media.fileName,
                          fileType: media.fileType,
                        })
                      }
                      style={{
                        width: "100%",
                      }}
                    >
                      <Image
                        source={{ uri: media.fileUrl }}
                        style={{
                          width: "100%",
                          height: isTwoColumnLayout ? 180 : 200,
                          borderRadius: 12,
                          backgroundColor: "#F3F4F6",
                        }}
                        resizeMode="cover"
                      />
                      <Text
                        className="text-gray-500 text-[11px] mt-1"
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {media.fileName}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={media.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                    style={{
                      maxWidth: "100%",
                    }}
                    onPress={() =>
                      setSelectedMedia({
                        url: media.fileUrl,
                        fileName: media.fileName,
                        fileType: media.fileType,
                      })
                    }
                  >
                    <Ionicons
                      name="document-attach"
                      size={16}
                      color="#3B82F6"
                    />
                    <Text
                      className="text-blue-700 text-[12px] ml-1 font-semibold flex-1"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {media.fileName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Footer - Always at bottom right */}
      <View className="px-4 pb-4">
        <TouchableOpacity
          className="flex-row items-center justify-end pt-3 border-t border-gray-100"
          onPress={handleUpvote}
          activeOpacity={0.7}
        >
          <Ionicons
            name={hasUpvoted ? "thumbs-up" : "thumbs-up-outline"}
            size={22}
            color={hasUpvoted ? "#F4C430" : "#6B7280"}
          />
          <Text className="ml-2 text-gray-700 font-semibold text-base">
            {upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewer
          visible={!!selectedMedia}
          mediaUrl={selectedMedia.url}
          fileName={selectedMedia.fileName}
          fileType={selectedMedia.fileType}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </View>
  );
};

export default function CasesScreen() {
  // ====== DATA HOOKS ======
  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    refresh: refreshIncidents,
  } = usePublicIncidents();
  const {
    bulletins,
    isLoading: bulletinsLoading,
    error: bulletinsError,
    refresh: refreshBulletins,
  } = useBulletins();
  const {
    offices,
    isLoading: officesLoading,
    error: officesError,
  } = useOffices();

  // ====== LOCAL UI STATE (unchanged) ======
  const [filteredIncidents, setFilteredIncidents] = useState<
    IncidentResponseDto[]
  >([]);
  const [filteredBulletins, setFilteredBulletins] = useState<
    OfficeBulletinDto[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<number>(0);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [officeFilter, setOfficeFilter] = useState<string>("All");
  const [incidentSortOrder, setIncidentSortOrder] = useState<"asc" | "desc">(
    "desc"
  );
  const [bulletinSortOrder, setBulletinSortOrder] = useState<"asc" | "desc">(
    "desc"
  );

  // ====== RESPONSIVE DIMENSIONS ======
  // useWindowDimensions automatically updates on orientation change
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isTwoColumnLayout = screenWidth > 670;

  // ====== FILTER FUNCTIONS ======
  const filterIncidents = useCallback(() => {
    let filtered = [...incidents]; // Create a copy to avoid mutation

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.trackingNumber || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (i) => (i.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort by date (on the copied array)
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateOfIncident).getTime();
      const dateB = new Date(b.dateOfIncident).getTime();
      return incidentSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredIncidents(filtered);
  }, [incidents, searchQuery, statusFilter, incidentSortOrder]);

  const filterBulletins = useCallback(() => {
    let filtered = [...bulletins]; // Create a copy to avoid mutation

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }

    // Office filter - match by adding " Admin" to the selected office name
    if (officeFilter !== "All") {
      filtered = filtered.filter((b) => {
        // Append " Admin" to the selected office filter and compare with createdBy
        const filterWithAdmin = `${officeFilter} Admin`;
        return b.createdBy.toLowerCase() === filterWithAdmin.toLowerCase();
      });
    }

    // Sort by date (on the copied array)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return bulletinSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredBulletins(filtered);
  }, [bulletins, searchQuery, officeFilter, bulletinSortOrder]);

  // ====== HELPER FUNCTIONS ======
  // Get unique statuses from incidents
  const getUniqueStatuses = () => {
    const statuses = new Set(
      incidents.map((i) => i.status || "Unknown").filter(Boolean)
    );
    return ["All", ...Array.from(statuses)];
  };

  // Get unique offices from API
  const getUniqueOffices = () => {
    if (!offices || offices.length === 0) {
      return ["All"];
    }
    const officeNames = offices
      .map((office) => office.fullName)
      .filter(Boolean)
      .sort();
    return ["All", ...officeNames];
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (selectedTab === 0) {
      await refreshIncidents();
    } else {
      await refreshBulletins();
    }
    setIsRefreshing(false);
  };

  const handleCaseClick = (trackingNumber?: string) => {
    if (!trackingNumber) return;
    router.push(`/case/${trackingNumber}` as never);
  };

  const getStatusColor = (status?: string | null): string => {
    const s = (status || "").toLowerCase();
    if (s === "in progress") return "#2196F3";
    if (s === "resolved") return "#4CAF50";
    if (s === "urgent") return "#F44336";
    return "#FFA000"; // default: pending / unknown
  };

  const getStatusIcon = (
    status?: string | null
  ): keyof typeof Ionicons.glyphMap => {
    const s = (status || "").toLowerCase();
    if (s === "resolved") return "checkmark-circle";
    return "time";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // ====== EFFECTS ======
  useEffect(() => {
    filterIncidents();
  }, [filterIncidents]);

  useEffect(() => {
    filterBulletins();
  }, [filterBulletins]);

  // Refresh data when screen comes into focus (e.g., returning from case details)
  useFocusEffect(
    React.useCallback(() => {
      refreshIncidents();
      refreshBulletins();
    }, [refreshIncidents, refreshBulletins])
  );

  // ====== LOADING STATE ======
  if (incidentsLoading && bulletinsLoading && officesLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <CircularLoader subtitle="Loading cases..." />
      </View>
    );
  }

  // ====== RENDER ======
  return (
    <View className="flex-1 bg-gray-50">
      {/* Keep header untouched */}
      <Stack.Screen options={{ title: "Community" }} />

      {/* HERO / NEWS MASTHEAD */}
      <View
        className="pt-14 pb-5"
        style={{
          backgroundColor: "#8B0000",
          borderBottomWidth: 0,
          paddingHorizontal: isTwoColumnLayout ? 40 : 16,
        }}
      >
        <Text
          className="font-extrabold"
          style={{
            color: "#D4AF37",
            fontSize: isTwoColumnLayout ? 32 : 26,
            textAlign: "left",
          }}
        >
          Community Bulletin
        </Text>
        <Text
          className="text-white/90 mt-1"
          style={{
            textAlign: "left",
            fontSize: isTwoColumnLayout ? 16 : 14,
          }}
        >
          Your latest public reports & office advisories
        </Text>

        {/* Search */}
        <View
          className="mt-4 bg-white rounded-full flex-row items-center shadow"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
            paddingHorizontal: isTwoColumnLayout ? 20 : 16,
            paddingVertical: isTwoColumnLayout ? 10 : 6,
            width: "100%",
          }}
        >
          <Ionicons
            name="search"
            size={isTwoColumnLayout ? 22 : 20}
            color="#6B7280"
          />
          <TextInput
            className="flex-1 ml-3"
            style={{
              fontSize: isTwoColumnLayout ? 16 : 14,
            }}
            placeholder={
              selectedTab === 0
                ? "Search reports by tracking no. or description"
                : "Search advisories by title or text"
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={isTwoColumnLayout ? 20 : 18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Segment Tabs */}
        <View
          className="mt-4 bg-white/10 rounded-xl p-1"
          style={{
            width: "100%",
          }}
        >
          <View className="flex-row">
            {[
              { label: "Reports", icon: "newspaper" as const },
              { label: "Office Advisories", icon: "megaphone" as const },
            ].map((tab, index) => (
              <TouchableOpacity
                key={tab.label}
                className={`flex-1 rounded-lg flex-row items-center justify-center ${
                  selectedTab === index ? "bg-white" : "bg-transparent"
                }`}
                style={{
                  paddingVertical: isTwoColumnLayout ? 12 : 8,
                  paddingHorizontal: isTwoColumnLayout ? 16 : 12,
                }}
                onPress={() => setSelectedTab(index)}
              >
                <Ionicons
                  name={tab.icon}
                  size={isTwoColumnLayout ? 18 : 16}
                  color={selectedTab === index ? "#8B0000" : "#FDE68A"}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    selectedTab === index ? "text-[#8B0000]" : "text-yellow-100"
                  }`}
                  style={{ fontSize: isTwoColumnLayout ? 15 : 14 }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        className="flex-1 pt-4"
        style={{
          paddingHorizontal: isTwoColumnLayout ? 40 : 16,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION TITLE */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="w-1.5 h-5 rounded-full mr-2"
              style={{ backgroundColor: "#8B0000" }}
            />
            <Text className="text-base font-semibold text-gray-800">
              {selectedTab === 0 ? "Reports" : "Latest Advisories"}
            </Text>
          </View>

          {/* Sort Order */}
          {selectedTab === 0 ? (
            <TouchableOpacity
              onPress={() =>
                setIncidentSortOrder(
                  incidentSortOrder === "desc" ? "asc" : "desc"
                )
              }
              className="flex-row items-center bg-white rounded-lg px-3 py-2 border border-gray-200"
            >
              <Ionicons
                name={incidentSortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#8B0000"
              />
              <Text className="text-xs font-semibold text-gray-700 ml-2">
                {incidentSortOrder === "desc" ? "Newest" : "Oldest"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                setBulletinSortOrder(
                  bulletinSortOrder === "desc" ? "asc" : "desc"
                )
              }
              className="flex-row items-center bg-white rounded-lg px-3 py-2 border border-gray-200"
            >
              <Ionicons
                name={bulletinSortOrder === "desc" ? "arrow-down" : "arrow-up"}
                size={14}
                color="#8B0000"
              />
              <Text className="text-xs font-semibold text-gray-700 ml-2">
                {bulletinSortOrder === "desc" ? "Newest" : "Oldest"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTERS */}
        <View className="mb-3">
          {selectedTab === 0 ? (
            <>
              {/* Status Filter */}
              <View className="mb-2">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="filter" size={14} color="#6B7280" />
                  <Text className="text-xs font-semibold text-gray-600 ml-1">
                    Filter by Status:
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {getUniqueStatuses().map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-lg mr-2 ${
                        statusFilter === status
                          ? "bg-[#8B0000]"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          statusFilter === status
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : (
            <>
              {/* Office Filter */}
              <View className="mb-2">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="business" size={14} color="#6B7280" />
                  <Text className="text-xs font-semibold text-gray-600 ml-1">
                    Filter by Office:
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingRight: 16,
                    flexGrow: 1,
                  }}
                  style={{ flexGrow: 0 }}
                >
                  {getUniqueOffices().map((office) => (
                    <TouchableOpacity
                      key={office}
                      onPress={() => setOfficeFilter(office)}
                      className={`px-4 py-2 rounded-lg mr-2 ${
                        officeFilter === office
                          ? "bg-[#8B0000]"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          officeFilter === office
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {office}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {selectedTab === 0 ? (
          <>
            {/* LOADING */}
            {incidentsLoading ? (
              <View className="flex-1 items-center justify-center py-20 bg-gray-50">
                <CircularLoader subtitle="Loading reports..." />
              </View>
            ) : incidentsError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                <Text className="text-red-800 text-center">
                  {incidentsError}
                </Text>
                <TouchableOpacity
                  className="bg-[#B71C1C] rounded-lg px-4 py-2 mt-3"
                  onPress={refreshIncidents}
                >
                  <Text className="text-white text-center font-medium">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredIncidents.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 mt-2 items-center border border-gray-100">
                <Ionicons name="newspaper-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-700 font-semibold text-lg mt-4">
                  No public reports found
                </Text>
                <Text className="text-gray-500 text-center mt-1">
                  Try a different search term or pull to refresh.
                </Text>
              </View>
            ) : (
              <View
                className="mb-6"
                style={{
                  flexDirection: isTwoColumnLayout ? "row" : "column",
                  flexWrap: isTwoColumnLayout ? "wrap" : "nowrap",
                  justifyContent: isTwoColumnLayout
                    ? "space-between"
                    : "flex-start",
                  rowGap: 12,
                  columnGap: 12,
                }}
              >
                {filteredIncidents.map((incident) => (
                  <TouchableOpacity
                    key={incident.id}
                    onPress={() => handleCaseClick(incident.trackingNumber)}
                    className="rounded-2xl bg-white border border-gray-100"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                      width: isTwoColumnLayout ? "48%" : "100%",
                      marginBottom: isTwoColumnLayout ? 0 : 12,
                    }}
                  >
                    {/* Card Header Ribbon */}
                    <View className="flex-row items-center justify-between px-4 pt-4">
                      <Text
                        className="text-lg font-extrabold text-gray-900 flex-1 mr-2"
                        numberOfLines={2}
                      >
                        {incident.incidentType || "Report"}
                      </Text>
                      <View
                        className="rounded-full px-3 py-1 flex-row items-center"
                        style={{
                          backgroundColor: `${getStatusColor(
                            incident.status
                          )}20`,
                        }}
                      >
                        <Ionicons
                          name={getStatusIcon(incident.status)}
                          size={14}
                          color={getStatusColor(incident.status)}
                        />
                        <Text
                          className="font-semibold text-[11px] ml-1"
                          style={{ color: getStatusColor(incident.status) }}
                        >
                          {incident.status || "Unknown"}
                        </Text>
                      </View>
                    </View>

                    {/* Meta Row */}
                    <View className="px-4 mt-2">
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="pricetag-outline"
                          size={14}
                          color="#C2410C"
                        />
                        <Text
                          className="text-xs ml-1 mr-3"
                          style={{ color: "#C2410C" }}
                        >
                          {incident.trackingNumber || "Unknown"}
                        </Text>
                        <Ionicons name="calendar" size={14} color="#C2410C" />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: "#C2410C" }}
                        >
                          {formatDate(incident.dateOfIncident)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => {
                          if (incident.location) {
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              incident.location
                            )}`;
                            Linking.openURL(url);
                          }
                        }}
                        disabled={!incident.location}
                      >
                        <Ionicons
                          name="location"
                          size={14}
                          color={incident.location ? "#8B0000" : "#6B7280"}
                        />
                        <Text
                          className="text-xs ml-1 flex-1"
                          numberOfLines={1}
                          style={{
                            color: incident.location ? "#8B0000" : "#6B7280",
                          }}
                        >
                          {incident.location || "Location not specified"}
                        </Text>
                        {incident.location && (
                          <Ionicons
                            name="open-outline"
                            size={12}
                            color="#8B0000"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Body */}
                    {Boolean(incident.description) && (
                      <Text
                        className="px-4 mt-3 text-[13px] leading-5 text-gray-700"
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {incident.description}
                      </Text>
                    )}

                    {/* Footer */}
                    <View className="px-4 pb-4 pt-3 mt-3 border-t border-gray-100 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Ionicons
                          name={
                            (incident.upvoteCount || 0) > 0
                              ? "thumbs-up"
                              : "thumbs-up-outline"
                          }
                          size={16}
                          color={
                            (incident.upvoteCount || 0) > 0
                              ? "#F4C430"
                              : "#6B7280"
                          }
                        />
                        <Text className="ml-1 text-gray-700 font-medium text-sm">
                          {incident.upvoteCount || 0}
                        </Text>
                        {incident.assignedOffice && (
                          <>
                            <Text className="text-gray-300 mx-2">•</Text>
                            <Ionicons
                              name="people-outline"
                              size={14}
                              color="#6B7280"
                            />
                            <Text
                              className="text-gray-600 ml-1 text-xs"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {incident.assignedOffice}
                            </Text>
                            <Text className="text-gray-300 mx-2">•</Text>
                            <Text className="text-gray-600 text-xs">
                              ETR:{" "}
                              {incident.estimatedResolutionDate
                                ? formatDate(incident.estimatedResolutionDate)
                                : "TBD"}
                            </Text>
                          </>
                        )}
                      </View>
                      <View className="flex-row items-center ml-2">
                        <Ionicons name="eye" size={16} color="#8B0000" />
                        <Text className="text-[#8B0000] ml-1 text-sm font-semibold">
                          Read more
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* LOADING */}
            {bulletinsLoading ? (
              <View className="flex-1 items-center justify-center py-20 bg-gray-50">
                <CircularLoader subtitle="Loading bulletins..." />
              </View>
            ) : bulletinsError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                <Text className="text-red-800 text-center">
                  {bulletinsError}
                </Text>
                <TouchableOpacity
                  className="bg-[#B71C1C] rounded-lg px-4 py-2 mt-3"
                  onPress={refreshBulletins}
                >
                  <Text className="text-white text-center font-medium">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredBulletins.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 mt-2 items-center border border-gray-100">
                <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-700 font-semibold text-lg mt-4">
                  No Office Advisories
                </Text>
                <Text className="text-gray-500 text-center mt-1">
                  There are no office bulletins available at the moment.
                </Text>
              </View>
            ) : (
              <View
                className="mb-6"
                style={{
                  flexDirection: isTwoColumnLayout ? "row" : "column",
                  flexWrap: isTwoColumnLayout ? "wrap" : "nowrap",
                  justifyContent: isTwoColumnLayout
                    ? "space-between"
                    : "flex-start",
                  rowGap: 12,
                  columnGap: 12,
                }}
              >
                {filteredBulletins.map((bulletin) => (
                  <BulletinCard
                    key={bulletin.id}
                    bulletin={bulletin}
                    isTwoColumnLayout={isTwoColumnLayout}
                    screenWidth={screenWidth}
                    onRelatedIncidentClick={handleCaseClick}
                    formatDate={formatDate}
                    onUpvoteSuccess={refreshBulletins}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
