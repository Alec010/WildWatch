import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationPicker from '../../location/components/LocationPicker';
import { LocationData } from '../../location/models/LocationModels';

interface LocationSectionProps {
  onLocationSelect: (locationData: LocationData) => void;
  selectedLocation?: LocationData | null;
  disabled?: boolean;
  required?: boolean;
}

export default function LocationSection({
  onLocationSelect,
  selectedLocation,
  disabled = false,
  required = true,
}: LocationSectionProps) {
  return (
    <View style={styles.container}>
      <LocationPicker
        onLocationSelect={onLocationSelect}
        initialLocation={selectedLocation}
        disabled={disabled}
        required={required}
        style={styles.locationPicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  locationPicker: {
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  tipsContent: {
    gap: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});
