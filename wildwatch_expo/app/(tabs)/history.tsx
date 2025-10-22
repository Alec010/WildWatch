import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import TopSpacing from "../../components/TopSpacing";
import { useMyHistory } from "../../src/features/incidents/hooks/useMyHistory";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { CircularLoader } from "../../components/CircularLoader";

export default function HistoryScreen() {
  // ====== DATA HOOKS (unchanged logic) ======
  const { incidents, isLoading, error, refresh } = useMyHistory();

  // ====== LOCAL UI STATE ======
  const [filteredIncidents, setFilteredIncidents] = useState<
    IncidentResponseDto[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [screenWidth, setScreenWidth] = useState<number>(
    Dimensions.get("window").width
  );
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [showDateRangePicker, setShowDateRangePicker] =
    useState<boolean>(false);
  const [pickingStartDate, setPickingStartDate] = useState<boolean>(true);

  // ====== FILTER ======
  useEffect(() => {
    filterIncidents();
  }, [incidents, searchQuery, selectedYear, dateRangeStart, dateRangeEnd]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isCompact = screenWidth < 670;

  // Get unique years from resolved incidents
  const getUniqueYears = () => {
    const resolvedIncidents = incidents.filter(
      (i) => (i.status || "").toLowerCase() === "resolved"
    );
    const years = new Set(
      resolvedIncidents.map((i) => {
        const date = new Date(i.submittedAt || i.dateOfIncident);
        return date.getFullYear().toString();
      })
    );
    return ["All", ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  };

  const clearDateRange = () => {
    setDateRangeStart("");
    setDateRangeEnd("");
    setShowDateRangePicker(false);
  };

  const filterIncidents = () => {
    let filtered = incidents;

    // Only show resolved incidents
    filtered = filtered.filter(
      (i) => (i.status || "").toLowerCase() === "resolved"
    );

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.trackingNumber || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q)
      );
    }

    // Year filter
    if (selectedYear !== "All") {
      filtered = filtered.filter((i) => {
        const date = new Date(i.submittedAt || i.dateOfIncident);
        return date.getFullYear().toString() === selectedYear;
      });
    }

    // Date range filter
    if (dateRangeStart && dateRangeEnd) {
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      endDate.setHours(23, 59, 59, 999); // Include full end day

      filtered = filtered.filter((i) => {
        const incidentDate = new Date(i.submittedAt || i.dateOfIncident);
        return incidentDate >= startDate && incidentDate <= endDate;
      });
    }

    setFilteredIncidents(filtered);
  };

  // ====== UI HELPERS (no logic changes to data) ======
  const handleIncidentClick = (trackingNumber?: string) => {
    if (!trackingNumber) return;
    router.push(`/case/${trackingNumber}` as never);
  };

  const getStatusColor = (status?: string | null): string => {
    const s = (status || "").toLowerCase();
    if (s === "in progress") return "#1976D2";
    if (s === "resolved") return "#4CAF50";
    if (s === "urgent") return "#F44336";
    if (s === "dismissed") return "#6B7280";
    return "#FFA000";
  };

  const getStatusIcon = (
    status?: string | null
  ): keyof typeof Ionicons.glyphMap => {
    const s = (status || "").toLowerCase();
    if (s === "resolved") return "checkmark-circle";
    if (s === "urgent") return "warning";
    if (s === "dismissed") return "close-circle";
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

  // Group by Year → Month for timeline sections (display-only)
  const grouped = useMemo(() => {
    const byYear: Record<string, Record<string, IncidentResponseDto[]>> = {};
    filteredIncidents.forEach((i) => {
      const d = i.submittedAt || i.dateOfIncident || new Date().toISOString();
      const date = new Date(d);
      const y = String(date.getFullYear());
      const m = date.toLocaleString("en-US", { month: "long" });
      byYear[y] = byYear[y] || {};
      byYear[y][m] = byYear[y][m] || [];
      byYear[y][m].push(i);
    });
    // Sort years desc and months desc
    const yearOrder = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
    const result: {
      year: string;
      months: { name: string; items: IncidentResponseDto[] }[];
    }[] = [];
    yearOrder.forEach((y) => {
      const months = Object.keys(byYear[y]).sort((a, b) => {
        const dA = new Date(`${a} 1, ${y}`).getTime();
        const dB = new Date(`${b} 1, ${y}`).getTime();
        return dB - dA;
      });
      result.push({
        year: y,
        months: months.map((m) => ({ name: m, items: byYear[y][m] })),
      });
    });
    return result;
  }, [filteredIncidents]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  // ====== LOADING ======
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <CircularLoader subtitle="Loading history..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Keep header untouched */}
      <Stack.Screen options={{ title: "History" }} />

      {/* ARCHIVE HERO */}
      <View
        className="pt-14 pb-5"
        style={{
          backgroundColor: "#8B0000",
          paddingHorizontal: isCompact ? 16 : 40,
        }}
      >
        <Text
          className="font-extrabold"
          style={{
            color: "#D4AF37",
            fontSize: isCompact ? 26 : 32,
          }}
        >
          My Case Archive
        </Text>
        <Text
          className="text-white/90 mt-1"
          style={{
            fontSize: isCompact ? 14 : 16,
          }}
        >
          Browse your resolved reports by year and month
        </Text>

        {/* Search */}
        <View
          className="mt-4 bg-white rounded-full flex-row items-center shadow"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
            paddingHorizontal: isCompact ? 12 : 20,
            paddingVertical: isCompact ? 6 : 14,
            height: isCompact ? 40 : 52,
          }}
        >
          <Ionicons name="search" size={isCompact ? 18 : 22} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2"
            style={{
              fontSize: isCompact ? 13 : 16,
              paddingVertical: 0,
            }}
            placeholder="Search by tracking no. or description"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={isCompact ? 16 : 20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENT – TIMELINE */}
      <ScrollView
        className="flex-1 pt-4"
        style={{
          paddingHorizontal: isCompact ? 16 : 40,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          if (showYearDropdown) setShowYearDropdown(false);
        }}
        scrollEventThrottle={16}
      >
        {/* FILTERS */}
        <View className="mb-3 flex-row items-center flex-wrap gap-2">
          {/* Year Dropdown Filter */}
          <View className="relative" style={{ zIndex: 1000 }}>
            <TouchableOpacity
              onPress={() => setShowYearDropdown(!showYearDropdown)}
              className={`rounded-lg px-4 py-2 flex-row items-center ${
                selectedYear !== "All"
                  ? "bg-[#8B0000]"
                  : "bg-white border border-gray-200"
              }`}
              style={{ minWidth: 140 }}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={selectedYear !== "All" ? "#FFF" : "#6B7280"}
              />
              <Text
                className={`text-sm font-semibold ml-2 flex-1 ${
                  selectedYear !== "All" ? "text-white" : "text-gray-700"
                }`}
              >
                {selectedYear === "All" ? "All Years" : selectedYear}
              </Text>
              <Ionicons
                name={showYearDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color={selectedYear !== "All" ? "#FFF" : "#6B7280"}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showYearDropdown && (
              <View
                className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                style={{
                  minWidth: 140,
                  maxHeight: 250,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <ScrollView bounces={false}>
                  {getUniqueYears().map((year, index) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                        if (year !== "All") {
                          clearDateRange();
                        }
                      }}
                      className={`px-4 py-3 ${
                        index !== getUniqueYears().length - 1
                          ? "border-b border-gray-100"
                          : ""
                      } ${selectedYear === year ? "bg-[#8B0000]/10" : ""}`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedYear === year
                            ? "text-[#8B0000]"
                            : "text-gray-700"
                        }`}
                      >
                        {year === "All" ? "All Years" : year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Range Picker Button */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setShowDateRangePicker(true)}
              className={`rounded-lg px-4 py-2 flex-row items-center ${
                dateRangeStart && dateRangeEnd
                  ? "bg-[#8B0000]"
                  : "bg-white border border-gray-200"
              }`}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={dateRangeStart && dateRangeEnd ? "#FFF" : "#8B0000"}
              />
              <Text
                className={`text-sm font-semibold ml-2 ${
                  dateRangeStart && dateRangeEnd
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {dateRangeStart && dateRangeEnd
                  ? `${formatDate(dateRangeStart)} - ${formatDate(
                      dateRangeEnd
                    )}`
                  : "Date Range"}
              </Text>
            </TouchableOpacity>
            {dateRangeStart && dateRangeEnd && (
              <TouchableOpacity onPress={clearDateRange} className="ml-2 p-2">
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date Range Modal */}
        <Modal
          visible={showDateRangePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDateRangePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowDateRangePicker(false)}
            className="flex-1 bg-black/50 justify-center items-center p-4"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View className="p-4 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900">
                  Select Date Range
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Choose start and end dates for your filter
                </Text>
              </View>

              {/* Quick Ranges */}
              <View className="p-4 border-b border-gray-200">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Quick Select:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      const today = new Date();
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      setDateRangeStart(lastMonth.toISOString().split("T")[0]);
                      setDateRangeEnd(today.toISOString().split("T")[0]);
                    }}
                    className="bg-gray-100 rounded-lg px-3 py-2"
                  >
                    <Text className="text-xs font-semibold text-gray-700">
                      Last Month
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const today = new Date();
                      const last3Months = new Date();
                      last3Months.setMonth(last3Months.getMonth() - 3);
                      setDateRangeStart(
                        last3Months.toISOString().split("T")[0]
                      );
                      setDateRangeEnd(today.toISOString().split("T")[0]);
                    }}
                    className="bg-gray-100 rounded-lg px-3 py-2"
                  >
                    <Text className="text-xs font-semibold text-gray-700">
                      Last 3 Months
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const today = new Date();
                      const lastYear = new Date();
                      lastYear.setFullYear(lastYear.getFullYear() - 1);
                      setDateRangeStart(lastYear.toISOString().split("T")[0]);
                      setDateRangeEnd(today.toISOString().split("T")[0]);
                    }}
                    className="bg-gray-100 rounded-lg px-3 py-2"
                  >
                    <Text className="text-xs font-semibold text-gray-700">
                      Last Year
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Inputs */}
              <View className="p-4">
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50"
                    placeholder="YYYY-MM-DD"
                    value={dateRangeStart}
                    onChangeText={setDateRangeStart}
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Example: 2024-01-01
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50"
                    placeholder="YYYY-MM-DD"
                    value={dateRangeEnd}
                    onChangeText={setDateRangeEnd}
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Example: 2024-12-31
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View className="p-4 border-t border-gray-200 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => {
                    clearDateRange();
                    setShowDateRangePicker(false);
                  }}
                  className="bg-gray-100 rounded-lg px-4 py-3 mr-2"
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDateRangePicker(false)}
                  className="bg-gray-200 rounded-lg px-4 py-3 mr-2"
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (dateRangeStart && dateRangeEnd) {
                      setSelectedYear("All");
                    }
                    setShowDateRangePicker(false);
                  }}
                  className="bg-[#8B0000] rounded-lg px-4 py-3"
                  disabled={!dateRangeStart || !dateRangeEnd}
                  style={{
                    opacity: !dateRangeStart || !dateRangeEnd ? 0.5 : 1,
                  }}
                >
                  <Text className="text-sm font-semibold text-white">
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
            <Text className="text-red-800 text-center">{error}</Text>
            <TouchableOpacity
              className="bg-[#8B0000] rounded-lg px-4 py-2 mt-3"
              onPress={refresh}
            >
              <Text className="text-white text-center font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 mt-4 items-center border border-gray-100">
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text className="text-gray-700 font-semibold text-lg mt-4">
              No resolved cases found
            </Text>
            <Text className="text-gray-500 text-center mt-1">
              Your resolved reports will appear here once cases are completed.
            </Text>
          </View>
        ) : (
          <View className="pb-8">
            {/* Vertical rail for the timeline */}
            {grouped.map(({ year, months }) => (
              <View key={year} className="mb-8">
                {/* Year Header */}
                <View className="flex-row items-center mb-3">
                  <View className="flex-1 h-[1px] bg-gray-200" />
                  <Text
                    className="mx-3 text-sm font-bold tracking-widest"
                    style={{ color: "#8B0000" }}
                  >
                    {year}
                  </Text>
                  <View className="flex-1 h-[1px] bg-gray-200" />
                </View>

                {months.map(({ name, items }) => (
                  <View key={`${year}-${name}`} className="mb-5">
                    {/* Month Label */}
                    <View className="flex-row items-center mb-3">
                      <View
                        className="w-1.5 h-4 rounded-full mr-2"
                        style={{ backgroundColor: "#8B0000" }}
                      />
                      <Text className="text-gray-800 font-semibold">
                        {name}
                      </Text>
                    </View>

                    {items.map((incident) => (
                      <TouchableOpacity
                        key={incident.id}
                        onPress={() =>
                          handleIncidentClick(incident.trackingNumber)
                        }
                        className="mb-3 bg-white border border-gray-100"
                        style={{
                          borderRadius: isCompact ? 12 : 16,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.06,
                          shadowRadius: 6,
                          elevation: 2,
                        }}
                      >
                        <View className="flex-row">
                          {/* Rail + Dot */}
                          <View
                            className="items-center"
                            style={{ width: isCompact ? 20 : 28 }}
                          >
                            <View
                              className="flex-1 bg-gray-200"
                              style={{ width: 2 }}
                            />
                            <View
                              className="absolute rounded-full"
                              style={{
                                top: isCompact ? 8 : 12,
                                width: isCompact ? 10 : 12,
                                height: isCompact ? 10 : 12,
                                backgroundColor: getStatusColor(
                                  incident.status
                                ),
                              }}
                            />
                          </View>

                          {/* Card Body */}
                          <View
                            className="flex-1"
                            style={{
                              paddingVertical: isCompact ? 10 : 12,
                              paddingRight: isCompact ? 12 : 16,
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <Text
                                className="text-gray-900 font-extrabold flex-1"
                                style={{
                                  fontSize: isCompact ? 14 : 16,
                                }}
                                numberOfLines={2}
                              >
                                {incident.incidentType || "Report"}
                              </Text>
                              <View
                                className="ml-2 rounded-full flex-row items-center"
                                style={{
                                  paddingHorizontal: isCompact ? 6 : 10,
                                  paddingVertical: isCompact ? 3 : 4,
                                  backgroundColor: `${getStatusColor(
                                    incident.status
                                  )}20`,
                                }}
                              >
                                <Ionicons
                                  name={getStatusIcon(incident.status)}
                                  size={isCompact ? 10 : 12}
                                  color={getStatusColor(incident.status)}
                                />
                                <Text
                                  className="font-semibold ml-1"
                                  style={{
                                    fontSize: isCompact ? 10 : 11,
                                    color: getStatusColor(incident.status),
                                  }}
                                >
                                  {incident.status || "Unknown"}
                                </Text>
                              </View>
                            </View>

                            {/* Meta */}
                            <View
                              className="flex-row items-center flex-wrap"
                              style={{ marginTop: isCompact ? 6 : 8 }}
                            >
                              <Ionicons
                                name="pricetag-outline"
                                size={isCompact ? 12 : 14}
                                color="#6B7280"
                              />
                              <Text
                                className="text-gray-600 ml-1 mr-2"
                                style={{ fontSize: isCompact ? 11 : 12 }}
                              >
                                #{incident.trackingNumber || "Unknown"}
                              </Text>
                              <Text
                                className="text-gray-300"
                                style={{ fontSize: isCompact ? 11 : 12 }}
                              >
                                •
                              </Text>
                              <View className="flex-row items-center ml-2">
                                <Ionicons
                                  name="calendar"
                                  size={isCompact ? 12 : 14}
                                  color="#6B7280"
                                />
                                <Text
                                  className="text-gray-600 ml-1"
                                  style={{ fontSize: isCompact ? 11 : 12 }}
                                >
                                  {formatDate(
                                    incident.submittedAt ||
                                      incident.dateOfIncident
                                  )}
                                </Text>
                              </View>
                              {incident.location ? (
                                <>
                                  <Text
                                    className="text-gray-300 mx-2"
                                    style={{ fontSize: isCompact ? 11 : 12 }}
                                  >
                                    •
                                  </Text>
                                  <View className="flex-row items-center flex-shrink">
                                    <Ionicons
                                      name="location"
                                      size={isCompact ? 12 : 14}
                                      color="#6B7280"
                                    />
                                    <Text
                                      className="text-gray-600 ml-1 flex-shrink"
                                      style={{ fontSize: isCompact ? 11 : 12 }}
                                      numberOfLines={isCompact ? 2 : 1}
                                    >
                                      {incident.location}
                                    </Text>
                                  </View>
                                </>
                              ) : null}
                            </View>

                            {Boolean(incident.description) && (
                              <Text
                                className="text-gray-700"
                                style={{
                                  marginTop: isCompact ? 6 : 8,
                                  fontSize: isCompact ? 12 : 13,
                                  lineHeight: isCompact ? 16 : 18,
                                }}
                                numberOfLines={isCompact ? 2 : 3}
                              >
                                {incident.description}
                              </Text>
                            )}

                            {/* Footer */}
                            <View
                              className="border-t border-gray-100 flex-row items-center justify-between"
                              style={{
                                marginTop: isCompact ? 8 : 12,
                                paddingTop: isCompact ? 8 : 12,
                              }}
                            >
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="thumbs-up-outline"
                                  size={isCompact ? 14 : 16}
                                  color="#6B7280"
                                />
                                <Text
                                  className="ml-1 text-gray-700 font-medium"
                                  style={{ fontSize: isCompact ? 12 : 13 }}
                                >
                                  {incident.upvoteCount || 0}
                                  {!isCompact && " Upvotes"}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-3">
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/report-document/${incident.trackingNumber}` as never
                                    );
                                  }}
                                  className="flex-row items-center"
                                >
                                  <Ionicons
                                    name="document-text"
                                    size={isCompact ? 14 : 16}
                                    color="#16A34A"
                                  />
                                  <Text
                                    className="text-[#16A34A] ml-1 font-semibold"
                                    style={{ fontSize: isCompact ? 12 : 13 }}
                                  >
                                    {isCompact ? "PDF" : "Report PDF"}
                                  </Text>
                                </TouchableOpacity>
                                <View className="flex-row items-center">
                                  <Ionicons
                                    name="eye"
                                    size={isCompact ? 14 : 16}
                                    color="#8B0000"
                                  />
                                  <Text
                                    className="text-[#8B0000] ml-1 font-semibold"
                                    style={{ fontSize: isCompact ? 12 : 13 }}
                                  >
                                    {isCompact ? "View" : "View details"}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
