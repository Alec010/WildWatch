import { getBackendUrl } from '@/config';
import { api } from './apiClient';

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  building?: string;
  buildingName?: string;
  buildingCode?: string;
  withinCampus?: boolean;
  distanceFromCampusCenter?: number;
  room?: string; // Optional specific room/location within the building
}

export interface GeolocationResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  building: string;
  buildingName: string;
  buildingCode: string;
  withinCampus: boolean;
  distanceFromCampusCenter: number;
  status: string;
  message: string;
}

export interface BuildingInfo {
  code: string;
  name: string;
  description: string;
  centerLatitude: number;
  centerLongitude: number;
  bounds: {
    southWestLat: number;
    southWestLng: number;
    northEastLat: number;
    northEastLng: number;
  };
}

class LocationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  /**
   * Get current location using browser's geolocation API
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 60000, // Reduced cache time for testing
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let message = 'Unknown error occurred';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  /**
   * Reverse geocode coordinates to get address and building info
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeolocationResponse> {
    try {
      const requestBody = { latitude, longitude };

      const response = await api.post('/api/geolocation/reverse-geocode', requestBody);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      throw error;
    }
  }

  /**
   * Get all campus buildings
   */
  async getBuildings(): Promise<BuildingInfo[]> {
    try {
      const response = await api.get('/api/geolocation/buildings');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }

  /**
   * Validate if coordinates are within campus
   */
  async validateLocation(latitude: number, longitude: number): Promise<boolean> {
    try {
      const response = await api.post('/api/geolocation/validate-location', { latitude, longitude });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error validating location:', error);
      return false;
    }
  }

  /**
   * Get campus information
   */
  async getCampusInfo() {
    try {
      const response = await api.get('/api/geolocation/campus-info');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching campus info:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
