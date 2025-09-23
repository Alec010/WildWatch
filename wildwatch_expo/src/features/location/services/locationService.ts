import * as Location from 'expo-location';
import { locationApi } from '../api/location_api';
import { 
  LocationData, 
  GeolocationResponse, 
  BuildingInfo, 
  CampusInfo,
  LocationError,
  LocationPermissionStatus,
  CAMPUS_CONFIG
} from '../models/LocationModels';

export class LocationService {
  private static instance: LocationService;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Check and request location permissions
   */
  async checkPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined'
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined'
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      console.log('Checking geolocation permissions...');
      
      // Check permissions first
      const permissionStatus = await this.checkPermissions();
      
      if (!permissionStatus.granted) {
        if (permissionStatus.canAskAgain) {
          const requestResult = await this.requestPermissions();
          if (!requestResult.granted) {
            throw new Error('Location permission denied by user');
          }
        } else {
          throw new Error('Location permission denied. Please enable location access in device settings.');
        }
      }

      console.log('Geolocation permission granted, requesting position...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      });

      console.log('Position received:', location.coords);
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error: any) {
      console.error('Error getting current location:', error);
      
      let message = 'Unknown error occurred';
      let description = 'Please try again or use map selection.';
      
      if (error.message.includes('denied')) {
        message = 'Location access denied';
        description = 'Please enable location access in your device settings and try again.';
      } else if (error.message.includes('unavailable')) {
        message = 'Location unavailable';
        description = 'Your device location is not available. Please try map selection.';
      } else if (error.message.includes('timeout')) {
        message = 'Location request timed out';
        description = 'Location detection took too long. Please try again or use map selection.';
      }
      
      const locationError: LocationError = {
        code: 'LOCATION_ERROR',
        message,
        description
      };
      
      throw locationError;
    }
  }

  /**
   * Reverse geocode coordinates to get address and building info
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeolocationResponse> {
    try {
      console.log('Starting reverse geocode request...');
      console.log('Coordinates:', { latitude, longitude });
      
      const response = await locationApi.reverseGeocode(latitude, longitude);
      console.log('Backend response:', response);
      
      return response;
    } catch (error: any) {
      console.error('Error in reverse geocoding:', error);
      throw error;
    }
  }

  /**
   * Get current location with full geocoding data
   */
  async getCurrentLocationWithGeocoding(): Promise<LocationData> {
    try {
      // Get current coordinates
      const coords = await this.getCurrentLocation();
      console.log('Got coordinates:', coords);
      
      // Get address and building info from backend
      const geoResponse = await this.reverseGeocode(coords.latitude, coords.longitude);
      console.log('Backend response:', geoResponse);
      
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

        return locationData;
      } else {
        throw new Error(geoResponse.message || 'Failed to process location');
      }
    } catch (error: any) {
      console.error('Error getting current location with geocoding:', error);
      throw error;
    }
  }

  /**
   * Validate if coordinates are within campus
   */
  async validateLocation(latitude: number, longitude: number): Promise<boolean> {
    try {
      return await locationApi.validateLocation(latitude, longitude);
    } catch (error) {
      console.error('Error validating location:', error);
      return false;
    }
  }

  /**
   * Get all campus buildings
   */
  async getBuildings(): Promise<BuildingInfo[]> {
    try {
      return await locationApi.getBuildings();
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }

  /**
   * Get campus information
   */
  async getCampusInfo(): Promise<CampusInfo> {
    try {
      return await locationApi.getCampusInfo();
    } catch (error) {
      console.error('Error fetching campus info:', error);
      throw error;
    }
  }

  /**
   * Check if a point is within campus bounds using polygon algorithm
   * This is a client-side implementation for immediate feedback
   */
  isWithinCampusBounds(latitude: number, longitude: number): boolean {
    const polygon = CAMPUS_CONFIG.BOUNDARY_POLYGON;
    return this.isPointInPolygon(latitude, longitude, polygon);
  }

  /**
   * Ray casting algorithm to determine if a point is inside a polygon
   */
  private isPointInPolygon(lat: number, lng: number, polygon: readonly { lat: number; lng: number }[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > lat) !== (polygon[j].lat > lat)) &&
          (lng < (polygon[j].lng - polygon[i].lng) * (lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km

    const latDistance = this.toRadians(lat2 - lat1);
    const lngDistance = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2))
            * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // convert to meters

    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get campus center coordinates
   */
  getCampusCenter() {
    return {
      latitude: CAMPUS_CONFIG.CENTER.LATITUDE,
      longitude: CAMPUS_CONFIG.CENTER.LONGITUDE,
    };
  }

  /**
   * Get campus zoom level for maps
   */
  getCampusZoom() {
    return CAMPUS_CONFIG.ZOOM;
  }
}

export const locationService = LocationService.getInstance();
