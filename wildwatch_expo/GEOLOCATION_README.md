# Geolocation Implementation for WildWatch Expo

This document describes the geolocation functionality implemented in the WildWatch Expo mobile application.

## Overview

The geolocation system provides comprehensive location services including:
- Current location detection using device GPS
- Interactive map selection with campus boundaries
- Building detection and validation
- Campus boundary validation
- Address geocoding via Google Maps API

## Architecture

### Core Components

1. **Location Models** (`src/features/location/models/LocationModels.ts`)
   - TypeScript interfaces for location data
   - Campus configuration constants
   - Error handling types

2. **Location API** (`src/features/location/api/location_api.ts`)
   - Backend API integration
   - Error handling and response processing
   - RESTful endpoints for geolocation services

3. **Location Service** (`src/features/location/services/locationService.ts`)
   - Core geolocation logic
   - Permission management
   - Campus boundary validation
   - Distance calculations

4. **Location Hook** (`src/features/location/hooks/useLocation.ts`)
   - React hook for location functionality
   - State management
   - Error handling

5. **UI Components**
   - `LocationPicker` - Main location selection component
   - `MapPickerModal` - Interactive map selection modal
   - `LocationSection` - Form section wrapper

## Features

### Current Location Detection
- Uses device GPS with high accuracy settings
- Handles permission requests gracefully
- Provides detailed error messages for different failure scenarios
- Integrates with backend for address geocoding

### Map Selection
- Interactive Google Maps integration
- Campus boundary visualization
- Building overlays with hover information
- Click-to-select functionality
- Current location centering

### Campus Validation
- Precise polygon-based boundary checking
- Building detection using coordinate bounds
- Visual feedback for on-campus vs off-campus locations
- Distance calculations from campus center

### Error Handling
- Comprehensive error messages
- Permission management
- Network error handling
- Fallback options for location selection

## Configuration

### Environment Variables
Create a `.env` file in the project root with:

```env
# Google Maps API Key (required for map functionality)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.2:8080/api
```

### Campus Configuration
Campus boundaries and building data are configured in `LocationModels.ts`:

```typescript
export const CAMPUS_CONFIG = {
  CENTER: {
    LATITUDE: 10.2955,
    LONGITUDE: 123.8800,
  },
  ZOOM: 17,
  MAX_DISTANCE_METERS: 800,
  BOUNDARY_POLYGON: [
    // Campus boundary coordinates
  ],
} as const;
```

## Dependencies

The following packages are required:

```json
{
  "expo-location": "~19.0.7",
  "react-native-maps": "1.18.0",
  "expo-maps": "~1.0.0"
}
```

## Usage

### Basic Location Selection

```tsx
import { LocationSection } from '../features/reports/components/LocationSection';
import { useReportForm } from '../features/reports/hooks/useReportForm';

function MyComponent() {
  const { form, handleLocationSelect } = useReportForm();

  return (
    <LocationSection
      onLocationSelect={handleLocationSelect}
      selectedLocation={form.latitude && form.longitude ? {
        latitude: form.latitude,
        longitude: form.longitude,
        formattedAddress: form.formattedAddress,
        building: form.building,
        buildingName: form.buildingName,
        buildingCode: form.buildingCode,
        withinCampus: form.withinCampus,
        distanceFromCampusCenter: form.distanceFromCampusCenter,
      } : null}
      disabled={false}
      required={true}
    />
  );
}
```

### Direct Location Service Usage

```tsx
import { useLocation } from '../features/location/hooks/useLocation';

function MyComponent() {
  const { getCurrentLocation, reverseGeocode, isLoading, error } = useLocation();

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      console.log('Location:', location);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleGetLocation} disabled={isLoading}>
      <Text>Get Current Location</Text>
    </TouchableOpacity>
  );
}
```

## API Integration

The location system integrates with the backend API endpoints:

- `POST /api/geolocation/reverse-geocode` - Convert coordinates to address
- `POST /api/geolocation/validate-location` - Validate campus boundaries
- `GET /api/geolocation/buildings` - Get campus building data
- `GET /api/geolocation/campus-info` - Get campus configuration

## Error Handling

The system provides comprehensive error handling for:

- **Permission Denied**: User denied location access
- **Location Unavailable**: GPS not available or disabled
- **Timeout**: Location request took too long
- **Network Errors**: API communication failures
- **Invalid Coordinates**: Out of range coordinate values

## Testing

To test the geolocation functionality:

1. Ensure you have a valid Google Maps API key
2. Run the app on a physical device (GPS required)
3. Test both current location and map selection
4. Verify campus boundary validation
5. Test error scenarios (deny permissions, disable GPS)

## Troubleshooting

### Common Issues

1. **Maps not loading**: Check Google Maps API key configuration
2. **Location not detected**: Ensure GPS is enabled and permissions granted
3. **Campus validation failing**: Verify campus boundary coordinates
4. **API errors**: Check backend connectivity and authentication

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('Location debug:', locationData);
```

## Future Enhancements

- Offline map caching
- Multiple campus support
- Custom map styles
- Location history
- Geofencing capabilities
- Enhanced building detection
