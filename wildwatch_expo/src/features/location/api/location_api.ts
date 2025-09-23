import { api } from '../../../../lib/api';
import { 
  GeolocationRequest, 
  GeolocationResponse, 
  BuildingInfo, 
  CampusInfo,
  LocationData 
} from '../models/LocationModels';

export class LocationApi {
  private static instance: LocationApi;

  public static getInstance(): LocationApi {
    if (!LocationApi.instance) {
      LocationApi.instance = new LocationApi();
    }
    return LocationApi.instance;
  }

  /**
   * Reverse geocode coordinates to get address and building info
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeolocationResponse> {
    try {
      console.log('Starting reverse geocode request...');
      
      const requestBody: GeolocationRequest = { latitude, longitude };
      console.log('Request body:', requestBody);

      const response = await api.post<GeolocationResponse>('/geolocation/reverse-geocode', requestBody);

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error in reverse geocoding:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid coordinates provided');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred while processing location');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw new Error(error.message || 'Failed to process location');
    }
  }

  /**
   * Validate if coordinates are within campus bounds
   */
  async validateLocation(latitude: number, longitude: number): Promise<boolean> {
    try {
      const response = await api.post<{ valid: boolean; message: string }>(
        '/geolocation/validate-location', 
        { latitude, longitude }
      );

      return response.data.valid;
    } catch (error: any) {
      console.error('Error validating location:', error);
      return false;
    }
  }

  /**
   * Get all campus buildings
   */
  async getBuildings(): Promise<BuildingInfo[]> {
    try {
      const response = await api.get<BuildingInfo[]>('/geolocation/buildings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching buildings:', error);
      throw new Error('Failed to load campus buildings');
    }
  }

  /**
   * Get building by code
   */
  async getBuildingByCode(code: string): Promise<BuildingInfo | null> {
    try {
      const response = await api.get<BuildingInfo>(`/geolocation/buildings/${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching building by code:', error);
      return null;
    }
  }

  /**
   * Get buildings within bounds
   */
  async getBuildingsWithinBounds(
    swLat: number, 
    swLng: number, 
    neLat: number, 
    neLng: number
  ): Promise<BuildingInfo[]> {
    try {
      const response = await api.get<BuildingInfo[]>('/geolocation/buildings/within-bounds', {
        params: { swLat, swLng, neLat, neLng }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching buildings within bounds:', error);
      return [];
    }
  }

  /**
   * Get campus information
   */
  async getCampusInfo(): Promise<CampusInfo> {
    try {
      const response = await api.get<CampusInfo>('/geolocation/campus-info');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching campus info:', error);
      throw new Error('Failed to load campus information');
    }
  }
}

export const locationApi = LocationApi.getInstance();
