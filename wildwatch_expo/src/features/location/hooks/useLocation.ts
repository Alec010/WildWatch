import { useState, useCallback } from 'react';
import { locationService } from '../services/locationService';
import { 
  LocationData, 
  LocationError, 
  LocationPermissionStatus,
  BuildingInfo,
  CampusInfo,
  GeolocationResponse
} from '../models/LocationModels';

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);

  /**
   * Check location permissions
   */
  const checkPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const status = await locationService.checkPermissions();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking permissions:', error);
      const errorStatus: LocationPermissionStatus = {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
      setPermissionStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const status = await locationService.requestPermissions();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      const errorStatus: LocationPermissionStatus = {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
      setPermissionStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  /**
   * Get current location with geocoding
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData> => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await locationService.getCurrentLocationWithGeocoding();
      return locationData;
    } catch (error: any) {
      console.error('Error getting current location:', error);
      const locationError: LocationError = {
        code: error.code || 'LOCATION_ERROR',
        message: error.message || 'Failed to get current location',
        description: error.description || 'Please try again or use map selection.'
      };
      setError(locationError);
      throw locationError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reverse geocode coordinates (returns raw GeolocationResponse)
   */
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<GeolocationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await locationService.reverseGeocode(latitude, longitude);
      return response;
    } catch (error: any) {
      console.error('Error in reverse geocoding:', error);
      const locationError: LocationError = {
        code: error.code || 'GEOCODING_ERROR',
        message: error.message || 'Failed to process location',
        description: error.description || 'Please try selecting a different location.'
      };
      setError(locationError);
      throw locationError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reverse geocode coordinates (returns LocationData)
   */
  const reverseGeocodeToLocationData = useCallback(async (latitude: number, longitude: number): Promise<LocationData> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await locationService.reverseGeocode(latitude, longitude);
      
      if (response.status === 'SUCCESS') {
        const locationData: LocationData = {
          latitude: response.latitude,
          longitude: response.longitude,
          formattedAddress: response.formattedAddress,
          building: response.building,
          buildingName: response.buildingName,
          buildingCode: response.buildingCode,
          withinCampus: response.withinCampus,
          distanceFromCampusCenter: response.distanceFromCampusCenter,
        };
        return locationData;
      } else {
        throw new Error(response.message || 'Failed to process location');
      }
    } catch (error: any) {
      console.error('Error in reverse geocoding:', error);
      const locationError: LocationError = {
        code: error.code || 'GEOCODING_ERROR',
        message: error.message || 'Failed to process location',
        description: error.description || 'Please try selecting a different location.'
      };
      setError(locationError);
      throw locationError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate location
   */
  const validateLocation = useCallback(async (latitude: number, longitude: number): Promise<boolean> => {
    try {
      return await locationService.validateLocation(latitude, longitude);
    } catch (error) {
      console.error('Error validating location:', error);
      return false;
    }
  }, []);

  /**
   * Get campus buildings
   */
  const getBuildings = useCallback(async (): Promise<BuildingInfo[]> => {
    try {
      return await locationService.getBuildings();
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }, []);

  /**
   * Get campus info
   */
  const getCampusInfo = useCallback(async (): Promise<CampusInfo> => {
    try {
      return await locationService.getCampusInfo();
    } catch (error) {
      console.error('Error fetching campus info:', error);
      throw error;
    }
  }, []);

  /**
   * Check if location is within campus bounds (client-side)
   */
  const isWithinCampusBounds = useCallback((latitude: number, longitude: number): boolean => {
    return locationService.isWithinCampusBounds(latitude, longitude);
  }, []);

  /**
   * Calculate distance from campus center
   */
  const calculateDistanceFromCampus = useCallback((latitude: number, longitude: number): number => {
    const campusCenter = locationService.getCampusCenter();
    return locationService.calculateDistance(
      latitude, 
      longitude, 
      campusCenter.latitude, 
      campusCenter.longitude
    );
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    permissionStatus,
    
    // Actions
    checkPermissions,
    requestPermissions,
    getCurrentLocation,
    reverseGeocode,
    reverseGeocodeToLocationData,
    validateLocation,
    getBuildings,
    getCampusInfo,
    isWithinCampusBounds,
    calculateDistanceFromCampus,
    clearError,
  };
};
