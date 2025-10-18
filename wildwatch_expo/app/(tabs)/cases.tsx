import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { usePublicIncidents } from "../../src/features/incidents/hooks/usePublicIncidents";
import { useBulletins } from "../../src/features/bulletins/hooks/useBulletins";
import type { OfficeBulletinDto } from "../../src/features/bulletins/models/BulletinModels";

export default function CasesScreen() {
  const { incidents, isLoading: incidentsLoading, error: incidentsError, refresh: refreshIncidents } = usePublicIncidents();
  const { bulletins, isLoading: bulletinsLoading, error: bulletinsError, refresh: refreshBulletins } = useBulletins();
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentResponseDto[]>([]);
  const [filteredBulletins, setFilteredBulletins] = useState<OfficeBulletinDto[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<number>(0);

  useEffect(() => {
    filterIncidents();
  }, [incidents, searchQuery]);

  useEffect(() => {
    filterBulletins();
  }, [bulletins, searchQuery]);

  const filterIncidents = () => {
    let filtered = incidents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.trackingNumber || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q)
      );
    }
    setFilteredIncidents(filtered);
  };

  const filterBulletins = () => {
    let filtered = bulletins;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }
    setFilteredBulletins(filtered);
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
    return "#FFA000";
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
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (incidentsLoading && bulletinsLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#B71C1C" />
          <Text className="text-[#B71C1C] mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: "Community" }} />

      <View
        style={{
          backgroundColor: "#8B0000",
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 0,
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#D4AF37", textAlign: "left" }}>
            Community Reports
          </Text>
          <Text style={{ color: "#FFFFFF", marginTop: 4, textAlign: "left" }}>
            View and track community incident reports.
          </Text>
        </View>
      </View>

      {/* Fixed Search Bar */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="bg-white rounded-3xl border border-gray-200 flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Search incidents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Fixed Tab Selector */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="bg-gray-100 rounded-lg p-1">
          <View className="flex-row">
            {["Cases", "Office Advisories"].map((tab, index) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-2 px-2 rounded-md ${
                  selectedTab === index ? "bg-white" : "bg-transparent"
                }`}
                onPress={() => setSelectedTab(index)}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    selectedTab === index
                      ? "text-[#B71C1C] font-bold"
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 0 ? (
          <>
            {incidentsError ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <Text className="text-red-800 text-center">{incidentsError}</Text>
                <TouchableOpacity
                  className="bg-[#B71C1C] rounded-lg px-4 py-2 mt-2"
                  onPress={refreshIncidents}
                >
                  <Text className="text-white text-center font-medium">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredIncidents.length === 0 ? (
              <View className="bg-white rounded-lg p-8 mt-4 items-center">
                <Text className="text-gray-500 text-center">
                  No public cases found
                </Text>
              </View>
            ) : (
              <View className="mb-4">
                {filteredIncidents.map((incident) => (
                  <TouchableOpacity
                    key={incident.id}
                    className="bg-white rounded-lg mb-3 shadow-sm"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    onPress={() => handleCaseClick(incident.trackingNumber)}
                  >
                    <View className="flex-row">
                      <View
                        className="rounded-l-lg"
                        style={{
                          width: 6,
                          backgroundColor: getStatusColor(incident.status),
                        }}
                      />
                      <View className="flex-1 p-4">
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="font-bold text-gray-900 text-lg flex-1 mr-2">
                            {incident.incidentType}
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
                              size={12}
                              color={getStatusColor(incident.status)}
                            />
                            <Text
                              className="font-medium text-xs ml-1"
                              style={{ color: getStatusColor(incident.status) }}
                            >
                              {incident.status || "Unknown"}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-600 text-sm mb-2">
                          Tracking: {incident.trackingNumber || "Unknown"}
                        </Text>
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="location" size={16} color="#6B7280" />
                          <Text
                            className="text-gray-500 ml-1 flex-1"
                            numberOfLines={1}
                          >
                            {incident.location}
                          </Text>
                        </View>
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="calendar" size={16} color="#6B7280" />
                          <Text className="text-gray-500 ml-1">
                            {formatDate(incident.dateOfIncident)}{" "}
                            {incident.timeOfIncident}
                          </Text>
                        </View>
                        {incident.assignedOffice ? (
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="person" size={16} color="#6B7280" />
                            <Text className="text-gray-500 ml-1">
                              Assigned to: {incident.assignedOffice}
                            </Text>
                          </View>
                        ) : null}
                        {incident.description ? (
                          <Text
                            className="text-gray-700 text-sm mt-2"
                            numberOfLines={2}
                          >
                            {incident.description}
                          </Text>
                        ) : null}
                        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <View className="flex-row items-center">
                            <Ionicons
                              name="thumbs-up-outline"
                              size={16}
                              color="#6B7280"
                            />
                            <Text className="ml-1 text-gray-600 font-medium text-sm">
                              {incident.upvoteCount || 0} Upvotes
                            </Text>
                            {incident.status?.toLowerCase() === "resolved" && (
                              <View className="ml-3 flex-row items-center">
                                <Ionicons
                                  name="star"
                                  size={16}
                                  color="#F59E0B"
                                />
                                <Text className="text-gray-500 ml-1 text-sm">
                                  Rate
                                </Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="eye" size={16} color="#8B0000" />
                            <Text className="text-[#8B0000] ml-1 text-sm font-medium">
                              View Details
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {bulletinsError ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <Text className="text-red-800 text-center">{bulletinsError}</Text>
                <TouchableOpacity
                  className="bg-[#B71C1C] rounded-lg px-4 py-2 mt-2"
                  onPress={refreshBulletins}
                >
                  <Text className="text-white text-center font-medium">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredBulletins.length === 0 ? (
              <View className="bg-white rounded-lg p-8 mt-4 items-center">
                <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-700 font-semibold text-lg mt-4">
                  No Office Advisories
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  There are no office bulletins available at the moment.
                </Text>
              </View>
            ) : (
              <View className="mb-4">
                {filteredBulletins.map((bulletin) => (
                  <View
                    key={bulletin.id}
                    className="bg-white rounded-lg mb-3 p-4 shadow-sm"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    {/* Bulletin Header */}
                    <View className="flex-row items-start mb-3">
                      <View className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                        <Ionicons name="megaphone" size={20} color="#8B0000" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-900 text-lg mb-1">
                          {bulletin.title}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="person-circle-outline" size={14} color="#6B7280" />
                          <Text className="text-gray-500 text-xs ml-1">
                            {bulletin.createdBy}
                          </Text>
                          <Text className="text-gray-400 mx-1">•</Text>
                          <Text className="text-gray-500 text-xs">
                            {formatDate(bulletin.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bulletin Description */}
                    <Text className="text-gray-700 text-sm leading-5 mb-3">
                      {bulletin.description}
                    </Text>

                    {/* Related Incidents */}
                    {bulletin.relatedIncidents && bulletin.relatedIncidents.length > 0 && (
                      <View className="mb-3">
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          Related Cases:
                        </Text>
                        <View className="flex-row flex-wrap">
                          {bulletin.relatedIncidents.map((incident) => (
                            <TouchableOpacity
                              key={incident.id}
                              className="bg-green-50 border border-green-200 rounded-full px-3 py-1 mr-2 mb-2"
                              onPress={() => handleCaseClick(incident.trackingNumber)}
                            >
                              <Text className="text-green-700 text-xs font-medium">
                                #{incident.trackingNumber}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Media Attachments */}
                    {bulletin.mediaAttachments && bulletin.mediaAttachments.length > 0 && (
                      <View className="mb-3">
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          Attachments ({bulletin.mediaAttachments.length}):
                        </Text>
                        <View className="flex-row flex-wrap">
                          {bulletin.mediaAttachments.map((media) => {
                            const isImage = media.fileType?.startsWith('image/');
                            
                            if (isImage) {
                              return (
                                <TouchableOpacity
                                  key={media.id}
                                  className="mb-2 mr-2"
                                  onPress={() => Linking.openURL(media.fileUrl)}
                                  style={{ width: Dimensions.get('window').width - 60 }}
                                >
                                  <Image
                                    source={{ uri: media.fileUrl }}
                                    style={{
                                      width: '100%',
                                      height: 200,
                                      borderRadius: 8,
                                      backgroundColor: '#F3F4F6',
                                    }}
                                    resizeMode="cover"
                                  />
                                  <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                                    {media.fileName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            } else {
                              return (
                                <TouchableOpacity
                                  key={media.id}
                                  className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mr-2 mb-2 flex-row items-center"
                                  onPress={() => Linking.openURL(media.fileUrl)}
                                >
                                  <Ionicons name="document-attach" size={16} color="#3B82F6" />
                                  <Text className="text-blue-700 text-xs ml-1 font-medium" numberOfLines={1}>
                                    {media.fileName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          })}
                        </View>
                      </View>
                    )}

                    {/* Upvote Count */}
                    <View className="flex-row items-center pt-3 border-t border-gray-100">
                      <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
                      <Text className="ml-1 text-gray-600 font-medium text-sm">
                        {bulletin.upvoteCount} Upvotes
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
