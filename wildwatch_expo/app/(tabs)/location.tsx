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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: CAMPUS_CONFIG.CENTER.LATITUDE as number,
    longitude: CAMPUS_CONFIG.CENTER.LONGITUDE as number,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const mapRef = useRef<MapView>(null);
  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = Math.max(0, windowHeight * 0.7);

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
        };
        setSelectedLocation(locationData);
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
      notifySelected(locationData);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to get current location");
    } finally {
      setIsProcessingLocation(false);
    }
  }, [getCurrentLocation]);

  const handleClearLocation = () => setSelectedLocation(null);

  const handleSaveLocation = () => {
    if (!selectedLocation) return;
    router.push({
      pathname: "/(tabs)/report",
      params: {
        latitude: selectedLocation.latitude?.toString(),
        longitude: selectedLocation.longitude?.toString(),
        formattedAddress: selectedLocation.formattedAddress,
        building: selectedLocation.building,
        buildingName: selectedLocation.buildingName,
        buildingCode: selectedLocation.buildingCode,
        withinCampus: selectedLocation.withinCampus?.toString(),
        distanceFromCampusCenter:
          selectedLocation.distanceFromCampusCenter?.toString(),
      },
    } as any);
  };

  const handleBackPress = () => {
    if (hasExistingImages) {
      router.push({
        pathname: "/(tabs)/camera",
        params: { fromLocation: "true" },
      } as any);
    } else {
      router.push("/(tabs)/camera" as any);
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

    return (
      <View style={styles.floatingLocationContent} pointerEvents="box-none">
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

          {selectedLocation.formattedAddress && (
            <Text
              style={[
                styles.floatingAddressText,
                isOutsideCampus
                  ? styles.outsideCampusText
                  : styles.insideCampusText,
              ]}
              numberOfLines={2}
            >
              {selectedLocation.formattedAddress}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSaveLocation}
            style={styles.saveOverlayButton}
          >
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            <Text style={styles.saveOverlayButtonText}>Save Location</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleClearLocation}
          style={styles.floatingClearButton}
        >
          <Ionicons name="close" size={16} color="#6b7280" />
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
    maxHeight: 220,
  },
  floatingLocationContent: {
    gap: 10,
  },
  floatingLocationHeader: { marginRight: 0 },
  floatingLocationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
    flexWrap: "wrap",
  },
  floatingLocationTitle: { fontSize: 16, fontWeight: "600" },
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
  floatingAddressText: { fontSize: 12, lineHeight: 16, color: "#111827" },
  floatingClearButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  insideCampusText: { color: "#166534" },
  outsideCampusText: { color: "#dc2626" },
  insideCampusBadge: { backgroundColor: "#dcfce7" },
  outsideCampusBadge: { backgroundColor: "#fecaca" },
  insideCampusBadgeText: { color: "#166534" },
  outsideCampusBadgeText: { color: "#dc2626" },
  saveOverlayButton: {
    marginTop: 8,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveOverlayButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
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
