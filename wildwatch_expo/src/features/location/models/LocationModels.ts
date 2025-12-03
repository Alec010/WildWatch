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

export interface GeolocationRequest {
  latitude: number;
  longitude: number;
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

export interface CampusInfo {
  centerLatitude: number;
  centerLongitude: number;
  maxDistanceMeters: number;
  totalBuildings: number;
}

export interface LocationError {
  code: string;
  message: string;
  description?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

// Campus configuration constants
export const CAMPUS_CONFIG = {
  CENTER: {
    LATITUDE: 10.2955,
    LONGITUDE: 123.8800,
  },
  ZOOM: 17,
  MAX_DISTANCE_METERS: 800,
  BOUNDARY_POLYGON: [
    { latitude: 10.297153610508257, longitude: 123.87918444217755 },
    { latitude: 10.296456911339208, longitude: 123.87927563728236 },
    { latitude: 10.294170119974705, longitude: 123.87994394768552 },
    { latitude: 10.294352090572659, longitude: 123.88092281728376 },
    { latitude: 10.294005902515728, longitude: 123.88106265579779 },
    { latitude: 10.294409788545215, longitude: 123.88163103169356 },
    { latitude: 10.29469827824969, longitude: 123.88147766042012 },
    { latitude: 10.295665826408769, longitude: 123.8817528265405 },
    { latitude: 10.296078586876392, longitude: 123.88089575177703 },
    { latitude: 10.296504661645105, longitude: 123.88083259889503 },
    { latitude: 10.296642248161724, longitude: 123.88048525806984 },
    { latitude: 10.297476642525188, longitude: 123.88037699599445 },
    { latitude: 10.29752546340363, longitude: 123.88003416608909 },
    { latitude: 10.29725472934614, longitude: 123.87993943677313 },
  ],
} as const;
