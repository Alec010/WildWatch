import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import Toast from "react-native-toast-message";
import { CircularLoader } from "../../components/CircularLoader";
import { bulletinAPI } from "../../src/features/bulletins/api/bulletin_api";
import { useBulletinUpvoteStatus } from "../../src/features/bulletins/hooks/useBulletinUpvoteStatus";
import { storage } from "../../lib/storage";
import { config } from "../../lib/config";
import { sanitizeLocation } from "../../src/utils/locationUtils";
import { useCommunityCases } from "../../src/features/incidents/hooks/useCommunityCases";
import { getStatusColor, getStatusIcon, formatDate } from "../../src/features/incidents/utils/caseUtils";
import type { OfficeBulletinDto } from "../../src/features/bulletins/models/BulletinModels";

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
      className="bg-white rounded-2xl border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Content Area */}
      <View className="p-4 flex-1" style={{ minWidth: 0 }}>
        {/* Header */}
        <View className="flex-row items-start mb-2" style={{ minWidth: 0 }}>
          <View className="bg-[#8B0000]/10 p-2 rounded-xl mr-3" style={{ flexShrink: 0 }}>
            <Ionicons name="megaphone" size={20} color="#8B0000" />
          </View>
          <View className="flex-1" style={{ minWidth: 0, flexShrink: 1 }}>
            <Text
              className="font-extrabold text-gray-900 text-[17px]"
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{ flexShrink: 1 }}
            >
              {bulletin.title}
            </Text>
            <View className="flex-row items-center mt-1" style={{ flexWrap: 'wrap' }}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#6B7280"
                style={{ flexShrink: 0 }}
              />
              <Text
                className="text-gray-500 text-xs ml-1 mr-1"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ flexShrink: 1, minWidth: 0 }}
              >
                {bulletin.createdBy.replace(/ Admin$/i, "")}
              </Text>
              <Text className="text-gray-300 mx-1" style={{ flexShrink: 0 }}>•</Text>
              <Text className="text-gray-500 text-xs" style={{ flexShrink: 0 }}>
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
          style={{ flexShrink: 1, minWidth: 0 }}
        >
          {bulletin.description}
        </Text>

        {/* Related Reports */}
        {bulletin.relatedIncidents && bulletin.relatedIncidents.length > 0 && (
          <View className="mb-3" style={{ minWidth: 0 }}>
            <Text className="text-[11px] font-semibold text-gray-600 mb-2">
              Related Reports ({bulletin.relatedIncidents.length}):
            </Text>
            <View className="flex-row flex-wrap">
              {bulletin.relatedIncidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  className="bg-green-50 border border-green-200 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                  style={{ maxWidth: "100%" }}
                  onPress={() =>
                    onRelatedIncidentClick(incident.trackingNumber)
                  }
                >
                  <Ionicons name="link" size={10} color="#15803D" style={{ flexShrink: 0 }} />
                  <Text 
                    className="text-green-700 text-[11px] font-semibold ml-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ flexShrink: 1, minWidth: 0 }}
                  >
                    #{incident.trackingNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Media */}
        {bulletin.mediaAttachments && bulletin.mediaAttachments.length > 0 && (
          <View className="mb-1" style={{ minWidth: 0 }}>
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
                        minWidth: 0,
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
                        style={{ minWidth: 0 }}
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
                      minWidth: 0,
                      flex: 1,
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
                      style={{ flexShrink: 0 }}
                    />
                    <Text
                      className="text-blue-700 text-[12px] ml-1 font-semibold flex-1"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={{ minWidth: 0, flexShrink: 1 }}
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
  // ====== MAIN HOOK ======
  const {
    // Data
    incidents,
    bulletins,
    offices,
    
    // Loading states
    incidentsLoading,
    bulletinsLoading,
    officesLoading,
    isRefreshing,
    
    // Errors
    incidentsError,
    bulletinsError,
    
    // Device layout
    screenWidth,
    isTwoColumnLayout,
    isMobile,
    isSmallTablet,
    isBigTablet,
    
    // Filters
    searchQuery,
    statusFilter,
    officeFilter,
    incidentSortOrder,
    bulletinSortOrder,
    setSearchQuery,
    setStatusFilter,
    setOfficeFilter,
    toggleIncidentSort,
    toggleBulletinSort,
    filteredIncidents,
    filteredBulletins,
    uniqueStatuses,
    uniqueOffices,
    
    // Pagination
    incidentsPagination,
    bulletinsPagination,
    currentPagination,
    
    // UI state
    selectedTab,
    setSelectedTab,
    
    // Actions
    onRefresh,
    refreshIncidents,
    refreshBulletins,
  } = useCommunityCases();

  // ====== HELPER FUNCTIONS ======
  const handleCaseClick = (trackingNumber?: string) => {
    if (!trackingNumber) return;
    router.push(`/case/${trackingNumber}` as never);
  };

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
          <View className="flex-row items-center flex-1">
            <View
              className="w-1.5 h-5 rounded-full mr-2"
              style={{ backgroundColor: "#8B0000" }}
            />
            <Text className="text-base font-semibold text-gray-800">
              {selectedTab === 0 ? "Reports" : "Latest Advisories"}
            </Text>
            {(() => {
              const range = currentPagination.getDisplayRange();
              return range.total > 0 ? (
                <Text className="text-gray-500 text-xs ml-2">
                  ({range.start}-{range.end} of {range.total})
                </Text>
              ) : null;
            })()}
          </View>

          {/* Sort Order */}
          {selectedTab === 0 ? (
            <TouchableOpacity
              onPress={toggleIncidentSort}
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
              onPress={toggleBulletinSort}
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
                  {uniqueStatuses.map((status) => (
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
                  {uniqueOffices.map((office) => (
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
              <>
                <View
                  className="mb-6"
                  style={{
                    flexDirection: isMobile ? "column" : "row",
                    flexWrap: isMobile ? "nowrap" : "wrap",
                    justifyContent: isMobile
                      ? "flex-start"
                      : isSmallTablet
                      ? "space-between"
                      : "space-between",
                    rowGap: 12,
                    columnGap: 12,
                  }}
                >
                  {incidentsPagination.paginatedData.map((incident) => (
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
                      width: isMobile
                        ? "100%"
                        : isSmallTablet
                        ? "31.5%"
                        : "23.5%",
                      marginBottom: isMobile ? 12 : 0,
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
                          const sanitizedLocation = sanitizeLocation(incident.location);
                          if (sanitizedLocation) {
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              sanitizedLocation
                            )}`;
                            Linking.openURL(url);
                          }
                        }}
                        disabled={!sanitizeLocation(incident.location)}
                      >
                        <Ionicons
                          name="location"
                          size={14}
                          color={sanitizeLocation(incident.location) ? "#8B0000" : "#6B7280"}
                        />
                        <Text
                          className="text-xs ml-1 flex-1"
                          numberOfLines={1}
                          style={{
                            color: sanitizeLocation(incident.location) ? "#8B0000" : "#6B7280",
                          }}
                        >
                          {sanitizeLocation(incident.location) || "Location not specified"}
                        </Text>
                        {sanitizeLocation(incident.location) && (
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

                {/* Load More Button - Bottom of List */}
                {incidentsPagination.hasMore && (
                  <View className="mb-4">
                    <TouchableOpacity
                      onPress={() => incidentsPagination.handlePageChange(incidentsPagination.currentPage + 1)}
                      className="bg-[#8B0000] rounded-xl py-4 px-6 flex-row items-center justify-center"
                      style={{
                        shadowColor: "#8B0000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text className="text-white font-bold text-base mr-2">
                        Load More
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                      <Text className="text-white/80 text-sm ml-2">
                        ({incidentsPagination.totalPages - incidentsPagination.currentPage} {incidentsPagination.totalPages - incidentsPagination.currentPage === 1 ? 'page' : 'pages'} remaining)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Pagination Controls */}
                {incidentsPagination.totalPages > 1 && (
                  <View className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={() => incidentsPagination.handlePageChange(incidentsPagination.currentPage - 1)}
                        disabled={incidentsPagination.currentPage === 1}
                        className={`flex-row items-center px-4 py-2 rounded-lg ${
                          incidentsPagination.currentPage === 1
                            ? "bg-gray-100 opacity-50"
                            : "bg-[#8B0000]"
                        }`}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={incidentsPagination.currentPage === 1 ? "#9CA3AF" : "#FFFFFF"}
                        />
                        <Text
                          className={`ml-1 font-semibold ${
                            incidentsPagination.currentPage === 1
                              ? "text-gray-400"
                              : "text-white"
                          }`}
                          style={{ fontSize: 14 }}
                        >
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <View className="flex-row items-center">
                        <Text className="text-gray-700 font-medium text-sm mr-2">
                          Page
                        </Text>
                        <Text className="text-[#8B0000] font-bold text-base">
                          {incidentsPagination.currentPage}
                        </Text>
                        <Text className="text-gray-500 font-medium text-sm mx-1">
                          of
                        </Text>
                        <Text className="text-gray-700 font-semibold text-base">
                          {incidentsPagination.totalPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => incidentsPagination.handlePageChange(incidentsPagination.currentPage + 1)}
                        disabled={incidentsPagination.currentPage === incidentsPagination.totalPages}
                        className={`flex-row items-center px-4 py-2 rounded-lg ${
                          incidentsPagination.currentPage === incidentsPagination.totalPages
                            ? "bg-gray-100 opacity-50"
                            : "bg-[#8B0000]"
                        }`}
                      >
                        <Text
                          className={`mr-1 font-semibold ${
                            incidentsPagination.currentPage === incidentsPagination.totalPages
                              ? "text-gray-400"
                              : "text-white"
                          }`}
                          style={{ fontSize: 14 }}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={
                            incidentsPagination.currentPage === incidentsPagination.totalPages ? "#9CA3AF" : "#FFFFFF"
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Page Numbers (for tablets) */}
                    {(isSmallTablet || isBigTablet) && incidentsPagination.totalPages > 1 && (
                      <View className="flex-row items-center justify-center mt-3 flex-wrap">
                        {Array.from({ length: Math.min(incidentsPagination.totalPages, 7) }, (_, i) => {
                          let pageNum: number;
                          if (incidentsPagination.totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (incidentsPagination.currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (incidentsPagination.currentPage >= incidentsPagination.totalPages - 3) {
                            pageNum = incidentsPagination.totalPages - 6 + i;
                          } else {
                            pageNum = incidentsPagination.currentPage - 3 + i;
                          }

                          return (
                            <TouchableOpacity
                              key={pageNum}
                              onPress={() => incidentsPagination.handlePageChange(pageNum)}
                              className={`px-3 py-1.5 mx-1 rounded-lg ${
                                incidentsPagination.currentPage === pageNum
                                  ? "bg-[#8B0000]"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Text
                                className={`font-semibold text-sm ${
                                  incidentsPagination.currentPage === pageNum
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {pageNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </>
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
              <>
                <View
                  className="mb-6"
                  style={{
                    flexDirection: isMobile ? "column" : "row",
                    flexWrap: isMobile ? "nowrap" : "wrap",
                    justifyContent: isMobile
                      ? "flex-start"
                      : isSmallTablet
                      ? "space-between"
                      : "space-between",
                    rowGap: 12,
                    columnGap: 12,
                  }}
                >
                  {bulletinsPagination.paginatedData.map((bulletin) => (
                    <View
                      key={bulletin.id}
                      style={{
                        width: isMobile
                          ? "100%"
                          : isSmallTablet
                          ? "31.5%"
                          : "23.5%",
                        marginBottom: isMobile ? 12 : 0,
                      }}
                    >
                      <BulletinCard
                        bulletin={bulletin}
                        isTwoColumnLayout={!isMobile}
                        screenWidth={screenWidth}
                        onRelatedIncidentClick={handleCaseClick}
                        formatDate={formatDate}
                        onUpvoteSuccess={refreshBulletins}
                      />
                    </View>
                  ))}
                </View>

                {/* Load More Button - Bottom of List for Bulletins */}
                {bulletinsPagination.hasMore && (
                  <View className="mb-4">
                    <TouchableOpacity
                      onPress={() => bulletinsPagination.handlePageChange(bulletinsPagination.currentPage + 1)}
                      className="bg-[#8B0000] rounded-xl py-4 px-6 flex-row items-center justify-center"
                      style={{
                        shadowColor: "#8B0000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text className="text-white font-bold text-base mr-2">
                        Load More
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                      <Text className="text-white/80 text-sm ml-2">
                        ({bulletinsPagination.totalPages - bulletinsPagination.currentPage} {bulletinsPagination.totalPages - bulletinsPagination.currentPage === 1 ? 'page' : 'pages'} remaining)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Pagination Controls for Bulletins */}
                {bulletinsPagination.totalPages > 1 && (
                  <View className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={() => bulletinsPagination.handlePageChange(bulletinsPagination.currentPage - 1)}
                        disabled={bulletinsPagination.currentPage === 1}
                        className={`flex-row items-center px-4 py-2 rounded-lg ${
                          bulletinsPagination.currentPage === 1
                            ? "bg-gray-100 opacity-50"
                            : "bg-[#8B0000]"
                        }`}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={bulletinsPagination.currentPage === 1 ? "#9CA3AF" : "#FFFFFF"}
                        />
                        <Text
                          className={`ml-1 font-semibold ${
                            bulletinsPagination.currentPage === 1
                              ? "text-gray-400"
                              : "text-white"
                          }`}
                          style={{ fontSize: 14 }}
                        >
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <View className="flex-row items-center">
                        <Text className="text-gray-700 font-medium text-sm mr-2">
                          Page
                        </Text>
                        <Text className="text-[#8B0000] font-bold text-base">
                          {bulletinsPagination.currentPage}
                        </Text>
                        <Text className="text-gray-500 font-medium text-sm mx-1">
                          of
                        </Text>
                        <Text className="text-gray-700 font-semibold text-base">
                          {bulletinsPagination.totalPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => bulletinsPagination.handlePageChange(bulletinsPagination.currentPage + 1)}
                        disabled={bulletinsPagination.currentPage === bulletinsPagination.totalPages}
                        className={`flex-row items-center px-4 py-2 rounded-lg ${
                          bulletinsPagination.currentPage === bulletinsPagination.totalPages
                            ? "bg-gray-100 opacity-50"
                            : "bg-[#8B0000]"
                        }`}
                      >
                        <Text
                          className={`mr-1 font-semibold ${
                            bulletinsPagination.currentPage === bulletinsPagination.totalPages
                              ? "text-gray-400"
                              : "text-white"
                          }`}
                          style={{ fontSize: 14 }}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={
                            bulletinsPagination.currentPage === bulletinsPagination.totalPages ? "#9CA3AF" : "#FFFFFF"
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Page Numbers (for tablets) */}
                    {(isSmallTablet || isBigTablet) && bulletinsPagination.totalPages > 1 && (
                      <View className="flex-row items-center justify-center mt-3 flex-wrap">
                        {Array.from({ length: Math.min(bulletinsPagination.totalPages, 7) }, (_, i) => {
                          let pageNum: number;
                          if (bulletinsPagination.totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (bulletinsPagination.currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (bulletinsPagination.currentPage >= bulletinsPagination.totalPages - 3) {
                            pageNum = bulletinsPagination.totalPages - 6 + i;
                          } else {
                            pageNum = bulletinsPagination.currentPage - 3 + i;
                          }

                          return (
                            <TouchableOpacity
                              key={pageNum}
                              onPress={() => bulletinsPagination.handlePageChange(pageNum)}
                              className={`px-3 py-1.5 mx-1 rounded-lg ${
                                bulletinsPagination.currentPage === pageNum
                                  ? "bg-[#8B0000]"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Text
                                className={`font-semibold text-sm ${
                                  bulletinsPagination.currentPage === pageNum
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {pageNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
