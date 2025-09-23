import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { LocationData } from '../models/LocationModels';
import MapPickerModal from './MapPickerModal';

interface LocationPickerProps {
  onLocationSelect: (locationData: LocationData) => void;
  initialLocation?: LocationData | null;
  disabled?: boolean;
  required?: boolean;
  style?: any;
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  disabled = false,
  required = false,
  style,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [showMapModal, setShowMapModal] = useState(false);
  const [locationMode, setLocationMode] = useState<'none' | 'current' | 'map'>('none');

  const {
    isLoading,
    error,
    permissionStatus,
    getCurrentLocation,
    reverseGeocode,
    checkPermissions,
    requestPermissions,
    clearError,
  } = useLocation();

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setLocationMode('current');
    }
  }, [initialLocation]);

  const handleCurrentLocation = useCallback(async () => {
    if (disabled) return;

    try {
      clearError();
      console.log('Starting location detection...');

      // Check permissions first
      let permission = permissionStatus;
      if (!permission) {
        permission = await checkPermissions();
      }

      if (!permission.granted) {
        if (permission.canAskAgain) {
          permission = await requestPermissions();
          if (!permission.granted) {
            Alert.alert(
              'Location Permission Required',
              'Please enable location access in your device settings to use this feature.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else {
          Alert.alert(
            'Location Access Denied',
            'Location access has been denied. Please enable location access in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Get current location with geocoding
      const locationData = await getCurrentLocation();
      console.log('Got location data:', locationData);

      setSelectedLocation(locationData);
      setLocationMode('current');
      onLocationSelect(locationData);

      // Show success message
      const message = locationData.withinCampus
        ? `Location detected: ${locationData.buildingName || 'Campus area'}`
        : 'Location detected (outside campus bounds)';

      Alert.alert('Location Selected', message, [{ text: 'OK' }]);

    } catch (error: any) {
      console.error('Error getting current location:', error);
      
      let title = 'Location Error';
      let message = error.message || 'Unable to access your current location.';
      let description = error.description || 'Please try map selection instead.';

      if (error.message?.includes('denied')) {
        title = 'Location Permission Denied';
        message = 'Location access denied by user';
        description = 'Please enable location access in your device settings and try again.';
      } else if (error.message?.includes('unavailable')) {
        title = 'Location Unavailable';
        message = 'Your device location is not available';
        description = 'Please try map selection instead.';
      } else if (error.message?.includes('timeout')) {
        title = 'Location Request Timeout';
        message = 'Location detection took too long';
        description = 'Please try again or use map selection.';
      }

      Alert.alert(title, `${message}\n\n${description}`, [{ text: 'OK' }]);
    }
  }, [disabled, permissionStatus, checkPermissions, requestPermissions, getCurrentLocation, onLocationSelect, clearError]);

  const handleMapSelection = useCallback((locationData: LocationData) => {
    setSelectedLocation(locationData);
    setLocationMode('map');
    setShowMapModal(false);
    onLocationSelect(locationData);

    const message = locationData.withinCampus
      ? `Location selected: ${locationData.buildingName || 'Campus area'}`
      : 'Location selected (outside campus bounds)';

    Alert.alert('Location Selected', message, [{ text: 'OK' }]);
  }, [onLocationSelect]);

  const handleClearLocation = useCallback(() => {
    setSelectedLocation(null);
    setLocationMode('none');
    // Notify parent that location was cleared
    onLocationSelect({
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
      building: '',
      buildingName: '',
      buildingCode: '',
    });
  }, [onLocationSelect]);

  const renderLocationDisplay = () => {
    if (!selectedLocation) return null;

    const isOutsideCampus = selectedLocation.withinCampus === false;

    return (
      <View style={[
        styles.locationCard,
        isOutsideCampus ? styles.outsideCampusCard : styles.insideCampusCard
      ]}>
        <View style={styles.locationHeader}>
          <View style={styles.locationInfo}>
            <View style={styles.locationTitleRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isOutsideCampus ? '#dc2626' : '#16a34a'}
              />
              <Text style={[
                styles.locationTitle,
                isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
              ]}>
                Location Selected
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
              <View style={styles.addressInfo}>
                <Ionicons
                  name="location"
                  size={16}
                  color={isOutsideCampus ? '#dc2626' : '#16a34a'}
                />
                <Text style={[
                  styles.addressText,
                  isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
                ]}>
                  {selectedLocation.formattedAddress}
                </Text>
              </View>
            )}

            {selectedLocation.latitude && selectedLocation.longitude && (
              <Text style={[
                styles.coordinatesText,
                isOutsideCampus ? styles.outsideCampusText : styles.insideCampusText
              ]}>
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleClearLocation}
            disabled={disabled}
            style={[
              styles.clearButton,
              isOutsideCampus ? styles.outsideCampusClearButton : styles.insideCampusClearButton
            ]}
          >
            <Ionicons
              name="close"
              size={16}
              color={isOutsideCampus ? '#dc2626' : '#16a34a'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>
          Location {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Text style={styles.description}>
          Use your current location or pick a location from the campus map
        </Text>
      </View>

      {!selectedLocation ? (
        <View style={styles.buttonContainer}>
          {/* Current Location Button */}
          <TouchableOpacity
            onPress={handleCurrentLocation}
            disabled={disabled || isLoading}
            style={[styles.primaryButton, disabled && styles.disabledButton]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="navigate" size={20} color="#ffffff" />
            )}
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Getting Current Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>

          {/* Map Selection Button */}
          <TouchableOpacity
            onPress={() => setShowMapModal(true)}
            disabled={disabled}
            style={[styles.secondaryButton, disabled && styles.disabledButton]}
          >
            <Ionicons name="map" size={20} color="#800000" />
            <Text style={styles.secondaryButtonText}>Pick from Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.selectedContainer}>
          {renderLocationDisplay()}
          
          <TouchableOpacity
            onPress={handleClearLocation}
            disabled={disabled}
            style={[styles.clearLocationButton, disabled && styles.disabledButton]}
          >
            <Ionicons name="refresh" size={16} color="#6b7280" />
            <Text style={styles.clearLocationButtonText}>Choose Different Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Picker Modal */}
      <MapPickerModal
        isVisible={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleMapSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  required: {
    color: '#dc2626',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#800000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#800000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#800000',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedContainer: {
    gap: 12,
  },
  locationCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  insideCampusCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  outsideCampusCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfo: {
    flex: 1,
    marginRight: 8,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insideCampusText: {
    color: '#166534',
  },
  outsideCampusText: {
    color: '#dc2626',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  insideCampusBadge: {
    backgroundColor: '#dcfce7',
  },
  outsideCampusBadge: {
    backgroundColor: '#fecaca',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 4,
    gap: 6,
  },
  insideCampusBuildingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  outsideCampusBuildingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
  buildingCodeBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  buildingCodeText: {
    fontSize: 12,
    color: '#16a34a',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  coordinatesText: {
    fontSize: 12,
    marginTop: 4,
  },
  clearButton: {
    padding: 4,
    borderRadius: 4,
  },
  insideCampusClearButton: {
    backgroundColor: '#dcfce7',
  },
  outsideCampusClearButton: {
    backgroundColor: '#fecaca',
  },
  clearLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 6,
  },
  clearLocationButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
