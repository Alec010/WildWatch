import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { LocationData, CAMPUS_CONFIG } from '../models/LocationModels';

interface MapPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (locationData: LocationData) => void;
}

const { width, height } = Dimensions.get('window');

export default function MapPickerModal({
  isVisible,
  onClose,
  onLocationSelect,
}: MapPickerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: CAMPUS_CONFIG.CENTER.LATITUDE,
    longitude: CAMPUS_CONFIG.CENTER.LONGITUDE,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const mapRef = useRef<MapView>(null);

  const {
    reverseGeocode,
    isWithinCampusBounds,
  } = useLocation();

  // Set loading to false when modal opens and center map on campus
  useEffect(() => {
    if (isVisible) {
      setIsLoading(false);
      
      // Center map on campus area
      const campusRegion = {
        latitude: CAMPUS_CONFIG.CENTER.LATITUDE,
        longitude: CAMPUS_CONFIG.CENTER.LONGITUDE,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setMapRegion(campusRegion);
      
      // Animate to campus region after a short delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(campusRegion, 1000);
        }
      }, 500);
    }
  }, [isVisible]);

  const handleMapPress = useCallback(async (event: any) => {
    if (isProcessingLocation) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    await handleLocationClick(latitude, longitude);
  }, [isProcessingLocation]);

  const handleLocationClick = useCallback(async (lat: number, lng: number) => {
    if (isProcessingLocation) return;

    setIsProcessingLocation(true);
    
    try {
      console.log('Map clicked at coordinates:', { lat, lng });
      console.log('Calling reverseGeocode...');
      
      // Get location data from backend
      const geoResponse = await reverseGeocode(lat, lng);
      
      console.log('Received geocoding response:', geoResponse);
      
      if (geoResponse.status === 'SUCCESS') {
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
        
        // Show warning if location is outside campus
        if (!geoResponse.withinCampus) {
          Alert.alert(
            'Location Outside Campus',
            'The selected location is outside the campus area. Please select a location within campus boundaries.',
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error(geoResponse.message || 'Failed to process location');
      }
    } catch (error: any) {
      console.error('Error processing location:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to process location. Please try selecting a different location.';
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingLocation(false);
    }
  }, [isProcessingLocation, reverseGeocode]);

  const handleCurrentLocationOnMap = useCallback(async () => {
    try {
      setIsProcessingLocation(true);
      
      // This would need to be implemented with actual current location
      // For now, we'll center on campus center
      const campusCenter = {
        latitude: CAMPUS_CONFIG.CENTER.LATITUDE,
        longitude: CAMPUS_CONFIG.CENTER.LONGITUDE,
      };
      
      setMapRegion({
        ...campusCenter,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...campusCenter,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
      
      await handleLocationClick(campusCenter.latitude, campusCenter.longitude);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get current location');
    } finally {
      setIsProcessingLocation(false);
    }
  }, [handleLocationClick]);

  const handleConfirmSelection = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  }, [selectedLocation, onLocationSelect]);

  const handleClose = useCallback(() => {
    setSelectedLocation(null);
    onClose();
  }, [onClose]);


  const renderCampusBoundary = () => {
    return (
      <Polygon
        coordinates={CAMPUS_CONFIG.BOUNDARY_POLYGON}
        fillColor="rgba(220, 38, 38, 0.2)"
        strokeColor="#dc2626"
        strokeWidth={6}
      />
    );
  };

  const renderSelectedLocationDisplay = () => {
    if (!selectedLocation) return null;

    const isOutsideCampus = selectedLocation.withinCampus === false;

    return (
      <View style={[
        styles.selectedLocationCard,
        isOutsideCampus ? styles.outsideCampusCard : styles.insideCampusCard
      ]}>
        <View style={styles.selectedLocationHeader}>
          <View style={styles.selectedLocationInfo}>
            <View style={styles.selectedLocationTitleRow}>
              <Ionicons
                name="location"
                size={20}
                color={isOutsideCampus ? '#dc2626' : '#16a34a'}
              />
              <Text style={[
                styles.selectedLocationTitle,
                isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
              ]}>
                Selected Location
              </Text>
              {selectedLocation.withinCampus !== undefined && (
                <View style={[
                  styles.statusBadge,
                  isOutsideCampus ? styles.outsideCampusBadge : styles.insideCampusBadge
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    isOutsideCampus ? styles.outsideCampusBadgeText : styles.insideCampusBadgeText
                  ]}>
                    {selectedLocation.withinCampus ? '✓ On Campus' : '⚠ Outside Campus'}
                  </Text>
                </View>
              )}
            </View>

            {/* Show building info for on-campus locations, or "OUTSIDE CAMPUS GROUNDS" for off-campus */}
            {isOutsideCampus ? (
              <View style={styles.buildingInfo}>
                <Ionicons name="business" size={16} color="#dc2626" />
                <Text style={styles.outsideCampusBuildingText}>
                  OUTSIDE CAMPUS GROUNDS
                </Text>
              </View>
            ) : selectedLocation.buildingName && (
              <View style={styles.buildingInfo}>
                <Ionicons name="business" size={16} color="#16a34a" />
                <Text style={styles.insideCampusBuildingText}>
                  {selectedLocation.buildingName}
                </Text>
                {selectedLocation.buildingCode && (
                  <View style={styles.buildingCodeBadge}>
                    <Text style={styles.buildingCodeText}>
                      {selectedLocation.buildingCode}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {selectedLocation.formattedAddress && (
              <Text style={[
                styles.addressText,
                isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
              ]}>
                {selectedLocation.formattedAddress}
              </Text>
            )}

            <Text style={[
              styles.coordinatesText,
              isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
            ]}>
              Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={24} color="#800000" />
              <Text style={styles.headerTitle}>Select Location from Map</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDescription}>
            Tap anywhere on the map to select a location. The red boundary shows the CITU campus area.
          </Text>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#800000" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              mapType="hybrid"
            >
              {/* Campus boundary */}
              {renderCampusBoundary()}
              
              {/* Selected location marker */}
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  pinColor={selectedLocation.withinCampus ? "#16a34a" : "#dc2626"}
                  anchor={{ x: 0.5, y: 1 }}
                />
              )}
            </MapView>
          )}

          {/* Current Location Button */}
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
        </View>

        {/* Selected Location Display */}
        {renderSelectedLocationDisplay()}

        {/* Instructions */}
        {!selectedLocation && !isLoading && (
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <Text style={styles.instructionsTitle}>How to select a location:</Text>
            </View>
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionText}>
                • Tap anywhere within the <Text style={styles.highlightText}>red CITU campus boundary</Text> to place a marker
              </Text>
              <Text style={styles.instructionText}>
                • The <Text style={styles.highlightText}>red outline</Text> shows the CITU campus area where you can select locations
              </Text>
              <Text style={styles.instructionText}>
                • Use zoom and pan to find the exact spot
              </Text>
              <Text style={styles.instructionText}>
                • Use the navigation button to center on your current location
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmSelection}
            disabled={!selectedLocation || isProcessingLocation}
            style={[
              styles.confirmButton,
              (!selectedLocation || isProcessingLocation) && styles.disabledButton
            ]}
          >
            {isProcessingLocation ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" style={styles.buttonLoader} />
                <Text style={styles.confirmButtonText}>Processing...</Text>
              </>
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  headerDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedLocationCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insideCampusCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  outsideCampusCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  selectedLocationTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  insideCampusText: {
    color: '#166534',
  },
  outsideCampusText: {
    color: '#dc2626',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  insideCampusBadge: {
    backgroundColor: '#dcfce7',
  },
  outsideCampusBadge: {
    backgroundColor: '#fecaca',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  insideCampusBadgeText: {
    color: '#166534',
  },
  outsideCampusBadgeText: {
    color: '#dc2626',
  },
  buildingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insideCampusBuildingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  outsideCampusBuildingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  buildingCodeBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  buildingCodeText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  coordinatesText: {
    fontSize: 13,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  instructionsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0369a1',
    letterSpacing: -0.2,
  },
  instructionsContent: {
    gap: 8,
  },
  instructionText: {
    fontSize: 15,
    color: '#0369a1',
    lineHeight: 22,
  },
  highlightText: {
    fontWeight: '700',
    color: '#dc2626',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 20,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#800000',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#800000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 56,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  buttonLoader: {
    marginRight: 8,
  },
});
