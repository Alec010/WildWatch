import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from "react-native-maps";
import { useLocation } from "../../src/features/location/hooks/useLocation";
import {
  LocationData,
  CAMPUS_CONFIG,
} from "../../src/features/location/models/LocationModels";
import { storage } from "../../lib/storage";
import { sanitizeLocation } from "../../src/utils/locationUtils";

const MAP_BUTTON_GAP = 12;

const H = Dimensions.get("window").height;
const isSmallIPhone = H < 700;
const isIPhone15Pro = H >= 800 && H < 900;
const isIPhone15ProMax = H >= 900;

const getSpacing = () => {
  if (isSmallIPhone) return { padding: 16, margin: 12, fontSize: 14 };
  if (isIPhone15Pro) return { padding: 18, margin: 14, fontSize: 15 };
  if (isIPhone15ProMax) return { padding: 20, margin: 16, fontSize: 16 };
  return { padding: 16, margin: 12, fontSize: 14 };
};

export default function LocationScreen() {
  const params = useLocalSearchParams();
  const hasExistingImages = params.hasImages === "true";

  console.log("Location screen received params:", {
    hasImages: params.hasImages,
    imageCount: params.imageCount,
    hasExistingImages,
  });

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [room, setRoom] = useState<string>("");
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: CAMPUS_CONFIG.CENTER.LATITUDE as number,
    longitude: CAMPUS_CONFIG.CENTER.LONGITUDE as number,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const mapRef = useRef<MapView>(null);
  const { height: windowHeight } = useWindowDimensions();

  // Calculate map height dynamically based on available space
  // Account for: StatusBar, Header, Buttons, Padding, and Buffer
  // iOS: SafeAreaView handles status bar automatically, so we don't subtract it
  // Android: Need to account for status bar height explicitly
  const HEADER_HEIGHT = Platform.OS === "ios" ? 70 : 80;
  const BUTTON_SECTION_HEIGHT = 80;
  const PADDING_AND_BUFFER = Platform.OS === "ios" ? 50 : 66;
  const STATUS_BAR_HEIGHT =
    Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

  const availableHeight =
    windowHeight -
    STATUS_BAR_HEIGHT -
    HEADER_HEIGHT -
    BUTTON_SECTION_HEIGHT -
    PADDING_AND_BUFFER;
  const mapHeight = Math.max(
    300,
    Math.min(availableHeight, windowHeight * 0.65)
  );

  const { padding, margin, fontSize } = getSpacing();

  const {
    isLoading,
    permissionStatus,
    getCurrentLocation,
    checkPermissions,
    requestPermissions,
    clearError,
    reverseGeocode,
  } = useLocation();

  // Load persisted location data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        try {
          // Mark that user is at location (flow step 2) with error handling
          try {
            await storage.setReportFlowStep(2);
          } catch (stepError) {
            console.error("Error setting report flow step:", stepError);
          }

          const loadPersistedLocation = async () => {
            try {
              const persistedLocation = await storage.getLocationData();
              if (isMounted && persistedLocation) {
                setSelectedLocation(persistedLocation);
                setRoom(persistedLocation.room || "");
                // Update map region to show the persisted location
                try {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: persistedLocation.latitude,
                      longitude: persistedLocation.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    1000
                  );
                } catch (mapError) {
                  console.error("Error animating map:", mapError);
                }
              }
            } catch (error) {
              console.error("Error loading persisted location:", error);
            }
          };

          await loadPersistedLocation();
        } catch (error) {
          console.error("Error in location focus effect:", error);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Save location data whenever selectedLocation or room changes
  React.useEffect(() => {
    if (selectedLocation) {
      const locationDataWithRoom = {
        ...selectedLocation,
        room: room.trim() || undefined,
      };
      // Add error handling
      storage.setLocationData(locationDataWithRoom).catch((error) => {
        console.error("Error saving location data:", error);
      });
    }
  }, [selectedLocation, room]);

  const notifySelected = (ld: LocationData) => {
    Alert.alert(
      "Location Selected",
      ld.withinCampus
        ? `Location: ${ld.buildingName || "Campus area"}`
        : "Selected location is outside campus bounds."
    );
  };

  const ensurePermission = async () => {
    let permission = permissionStatus || (await checkPermissions());
    if (!permission.granted) {
      permission = permission.canAskAgain
        ? await requestPermissions()
        : permission;
    }
    return permission.granted;
  };

  const handleCurrentLocation = async () => {
    try {
      clearError();
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access in your device settings."
        );
        return;
      }
      const locationData = await getCurrentLocation();
      setSelectedLocation(locationData);
      // Explicitly save to storage to ensure persistence
      await storage.setLocationData(locationData);
      mapRef.current?.animateToRegion(
        {
          latitude: locationData.latitude as number,
          longitude: locationData.longitude as number,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
      notifySelected(locationData);
    } catch (error: any) {
      Alert.alert(
        "Location Error",
        error?.message || "Unable to get current location."
      );
    }
  };

  const handleMapPress = useCallback(
    async (event: MapPressEvent) => {
      if (isProcessingLocation) return;
      const { latitude, longitude } = event.nativeEvent.coordinate;
      await handleLocationClick(latitude, longitude);
    },
    [isProcessingLocation]
  );

  const handleLocationClick = useCallback(
    async (lat: number, lng: number) => {
      if (isProcessingLocation) return;
      setIsProcessingLocation(true);
      try {
        const geoResponse = await reverseGeocode(lat, lng);
        if (geoResponse.status !== "SUCCESS")
          throw new Error(geoResponse.message || "Reverse geocode failed.");
        const locationData: LocationData = {
          latitude: geoResponse.latitude,
          longitude: geoResponse.longitude,
          formattedAddress: geoResponse.formattedAddress,
          building: geoResponse.building,
          buildingName: geoResponse.buildingName,
          buildingCode: geoResponse.buildingCode,
          withinCampus: geoResponse.withinCampus,
          distanceFromCampusCenter: geoResponse.distanceFromCampusCenter,
          room: room.trim() || undefined,
        };
        setSelectedLocation(locationData);
        // Explicitly save to storage to ensure persistence
        await storage.setLocationData(locationData);
        mapRef.current?.animateToRegion(
          {
            latitude: locationData.latitude as number,
            longitude: locationData.longitude as number,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
        notifySelected(locationData);
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Failed to process location.");
      } finally {
        setIsProcessingLocation(false);
      }
    },
    [isProcessingLocation, reverseGeocode]
  );

  const handleCurrentLocationOnMap = useCallback(async () => {
    try {
      setIsProcessingLocation(true);
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access in your device settings."
        );
        return;
      }
      const locationData = await getCurrentLocation();
      setMapRegion({
        latitude: locationData.latitude as number,
        longitude: locationData.longitude as number,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: locationData.latitude as number,
          longitude: locationData.longitude as number,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
      setSelectedLocation(locationData);
      // Explicitly save to storage to ensure persistence
      await storage.setLocationData(locationData);
      notifySelected(locationData);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to get current location");
    } finally {
      setIsProcessingLocation(false);
    }
  }, [getCurrentLocation]);

  const handleClearLocation = async () => {
    setSelectedLocation(null);
    setRoom("");
    // Also clear from storage when location is cleared
    await storage.removeLocationData();
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) return;

    const locationDataWithRoom = {
      ...selectedLocation,
      room: room.trim() || undefined,
    };

    console.log("Saving location data:", locationDataWithRoom);

    // Ensure location data is saved to storage before navigation with error handling
    try {
      await storage.setLocationData(locationDataWithRoom);
    } catch (storageError) {
      console.error("Error saving location data:", storageError);
      Alert.alert(
        "Storage Error",
        "Failed to save location. Please try again.",
        [{ text: "OK" }]
      );
      return; // Don't navigate if save fails
    }

    const navigationParams = {
      latitude: selectedLocation.latitude?.toString(),
      longitude: selectedLocation.longitude?.toString(),
      formattedAddress: selectedLocation.formattedAddress,
      building: selectedLocation.building,
      buildingName: selectedLocation.buildingName,
      buildingCode: selectedLocation.buildingCode,
      room: room.trim() || "",
      withinCampus: selectedLocation.withinCampus?.toString(),
      distanceFromCampusCenter:
        selectedLocation.distanceFromCampusCenter?.toString(),
    };

    console.log("Navigating to report with params:", navigationParams);

    // Navigate with error handling
    try {
      await router.push({
        pathname: "/(tabs)/report",
        params: navigationParams,
      } as any);
    } catch (navError: any) {
      console.error("Navigation error:", navError);
      Alert.alert("Navigation Error", "Failed to navigate. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleBackPress = async () => {
    try {
      if (hasExistingImages) {
        await router.push({
          pathname: "/(tabs)/camera",
          params: { fromLocation: "true" },
        } as any);
      } else {
        await router.push("/(tabs)/camera" as any);
      }
    } catch (navError) {
      console.error("Navigation error in handleBackPress:", navError);
      // Fallback: try simple navigation
      try {
        await router.push("/(tabs)/camera" as any);
      } catch (fallbackError) {
        console.error("Fallback navigation failed:", fallbackError);
      }
    }
  };

  const renderCampusBoundary = () => (
    <Polygon
      coordinates={CAMPUS_CONFIG.BOUNDARY_POLYGON as any}
      fillColor="rgba(220, 38, 38, 0.2)"
      strokeColor="#dc2626"
      strokeWidth={6}
    />
  );

  const renderLocationOverlay = () => {
    if (!selectedLocation) return null;
    const isOutsideCampus = selectedLocation.withinCampus === false;
    const sanitizedAddress = sanitizeLocation(
      selectedLocation.formattedAddress
    );

    return (
      <View style={styles.floatingLocationContent} pointerEvents="box-none">
        <TouchableOpacity
          onPress={handleClearLocation}
          style={styles.floatingClearButton}
        >
          <Ionicons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>

        <View style={styles.floatingLocationHeader}>
          <View style={styles.floatingLocationTitleRow}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={isOutsideCampus ? "#dc2626" : "#16a34a"}
            />
            <Text
              style={[
                styles.floatingLocationTitle,
                isOutsideCampus
                  ? styles.outsideCampusText
                  : styles.insideCampusText,
              ]}
            >
              Location Selected
            </Text>
            {selectedLocation.withinCampus !== undefined && (
              <View
                style={[
                  styles.floatingStatusBadge,
                  isOutsideCampus
                    ? styles.outsideCampusBadge
                    : styles.insideCampusBadge,
                ]}
              >
                <Text
                  style={[
                    styles.floatingStatusBadgeText,
                    isOutsideCampus
                      ? styles.outsideCampusBadgeText
                      : styles.insideCampusBadgeText,
                  ]}
                >
                  {selectedLocation.withinCampus ? "✓ On Campus" : "⚠ Outside"}
                </Text>
              </View>
            )}
          </View>

          {isOutsideCampus ? (
            <Text style={styles.floatingOutsideCampusText}>
              OUTSIDE CAMPUS GROUNDS
            </Text>
          ) : (
            selectedLocation.buildingName && (
              <Text style={styles.floatingBuildingText}>
                {selectedLocation.buildingName}
                {selectedLocation.buildingCode &&
                  ` (${selectedLocation.buildingCode})`}
              </Text>
            )
          )}

          {sanitizedAddress && (
            <Text
              style={[
                styles.floatingAddressText,
                isOutsideCampus
                  ? styles.outsideCampusText
                  : styles.insideCampusText,
              ]}
              numberOfLines={2}
            >
              {sanitizedAddress}
            </Text>
          )}
        </View>

        {/* Room/Specific Location Input */}
        <View style={styles.roomInputContainer}>
          <View style={styles.roomInputLabelRow}>
            <Ionicons
              name="location"
              size={16}
              color={isOutsideCampus ? "#dc2626" : "#16a34a"}
            />
            <Text
              style={[
                styles.roomInputLabel,
                isOutsideCampus
                  ? styles.outsideCampusText
                  : styles.insideCampusText,
              ]}
            >
              Specific Room/Location
            </Text>
            <Text style={styles.roomInputOptional}>(Optional)</Text>
          </View>
          <TextInput
            style={[
              styles.roomInput,
              isOutsideCampus
                ? styles.roomInputOutsideCampus
                : styles.roomInputInsideCampus,
            ]}
            placeholder="e.g., NGE101, GL2304"
            placeholderTextColor="#9ca3af"
            value={room}
            onChangeText={setRoom}
            editable={!isOutsideCampus}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.roomInputHint}>
            Enter the specific room or location within the building
          </Text>
        </View>

        {/* Save Location Button */}
        <TouchableOpacity
          onPress={handleSaveLocation}
          style={styles.saveOverlayButton}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.saveOverlayButtonText}>Save Location</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerWrap}>
        <View style={styles.headerAccent} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              Step 2 (Location Selection)
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              Choose your current location or select from map
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Location Help",
                "Use your current location or tap on the campus map. The red boundary shows the CITU campus."
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Location Help"
            style={styles.headerHelpBtn}
          >
            <Ionicons name="help-circle" size={22} color="#FFD166" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.mapBlock, { gap: MAP_BUTTON_GAP }]}>
          <View style={[styles.mapContainer, { height: mapHeight }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
              showsScale
              mapType="hybrid"
            >
              {renderCampusBoundary()}

              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  pinColor={
                    selectedLocation.withinCampus ? "#16a34a" : "#dc2626"
                  }
                  anchor={{ x: 0.5, y: 1 }}
                />
              )}
            </MapView>

            <TouchableOpacity
              onPress={handleCurrentLocationOnMap}
              disabled={isProcessingLocation || isLoading}
              style={styles.currentLocationButton}
            >
              {isProcessingLocation ? (
                <ActivityIndicator size="small" color="#800000" />
              ) : (
                <Ionicons name="navigate" size={20} color="#800000" />
              )}
            </TouchableOpacity>

            {selectedLocation && (
              <View
                style={styles.floatingLocationCard}
                pointerEvents="box-none"
              >
                {renderLocationOverlay()}
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleCurrentLocation}
                disabled={isLoading}
                style={[
                  styles.primaryButton,
                  isLoading && styles.disabledButton,
                  selectedLocation && styles.primaryButtonWithClear,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="navigate" size={20} color="#ffffff" />
                )}
                <Text style={styles.primaryButtonText}>
                  {isLoading ? "Getting Location..." : "Use Current Location"}
                </Text>
              </TouchableOpacity>

              {selectedLocation && (
                <TouchableOpacity
                  onPress={handleClearLocation}
                  style={styles.clearLocationButton}
                >
                  <Ionicons name="refresh" size={16} color="#6b7280" />
                  <Text style={styles.clearLocationButtonText}>
                    Change Location
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  headerWrap: {
    backgroundColor: "#7A0000",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAccent: { height: 4, backgroundColor: "#D4AF37", width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextBox: { flex: 1, marginRight: 8 },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  headerSubtitle: { color: "#FFE8A3", fontSize: 12, marginTop: 2 },
  headerHelpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mapBlock: {
    paddingBottom: 12,
  },
  mapContainer: {
    width: "100%",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  currentLocationButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  floatingLocationCard: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 320,
  },
  floatingLocationContent: {
    gap: 0,
    position: "relative",
  },
  floatingLocationHeader: {
    marginRight: 32,
    marginBottom: 12,
  },
  floatingLocationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  floatingLocationTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  floatingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  floatingStatusBadgeText: { fontSize: 11, fontWeight: "500" },
  floatingOutsideCampusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 4,
  },
  floatingBuildingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#166534",
    marginBottom: 4,
  },
  floatingAddressText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#111827",
    marginTop: 4,
  },
  floatingClearButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  insideCampusText: { color: "#166534" },
  outsideCampusText: { color: "#dc2626" },
  insideCampusBadge: { backgroundColor: "#dcfce7" },
  outsideCampusBadge: { backgroundColor: "#fecaca" },
  insideCampusBadgeText: { color: "#166534" },
  outsideCampusBadgeText: { color: "#dc2626" },
  roomInputContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  roomInputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
    flexWrap: "wrap",
  },
  roomInputLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  roomInputOptional: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "400",
    marginLeft: 2,
  },
  roomInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 6,
    minHeight: 48,
  },
  roomInputInsideCampus: {
    borderColor: "#86efac",
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  roomInputOutsideCampus: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    color: "#6b7280",
  },
  roomInputHint: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 0,
    lineHeight: 14,
  },
  saveOverlayButton: {
    marginTop: 0,
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveOverlayButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonContainer: {
    marginTop: 0,
    marginBottom: 12,
    paddingHorizontal: 12,
    width: "100%",
    alignSelf: "stretch",
  },
  buttonRow: { flexDirection: "row", gap: 12 },
  primaryButton: {
    backgroundColor: "#800000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  primaryButtonWithClear: { flex: 0.6 },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  clearLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 6,
    flex: 0.4,
  },
  clearLocationButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
});
