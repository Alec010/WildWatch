// Configuration file for WildWatch Expo app
// All configuration comes from environment variables

// Environment detection
export const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

// Read from Expo inlined env variables
const API_BASE_URL: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_TIMEOUT: string | undefined = process.env.EXPO_PUBLIC_API_TIMEOUT;
const FRONTEND_URL: string | undefined = process.env.EXPO_PUBLIC_FRONTEND_URL;
const GOOGLE_MAPS_API_KEY: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const APP_NAME: string | undefined = process.env.EXPO_PUBLIC_APP_NAME;
const APP_VERSION: string | undefined = process.env.EXPO_PUBLIC_APP_VERSION;

// Validate required environment variables
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required in .env file');
}

export const config = {
  // Environment info
  ENV,

  // Backend API configuration
  API: {
    BASE_URL: API_BASE_URL,
    TIMEOUT: API_TIMEOUT ? parseInt(API_TIMEOUT) : 180000, // Default: 3 minutes for image uploads
  },

  // Frontend URL for OAuth redirects
  FRONTEND: {
    URL: FRONTEND_URL || 'http://192.168.1.60:3000',
  },

  // Google Maps configuration
  GOOGLE_MAPS: {
    API_KEY: GOOGLE_MAPS_API_KEY || '',
  },

  // App configuration
  APP: {
    NAME: APP_NAME || 'WildWatch',
    VERSION: APP_VERSION || '1.0.0',
  }
};
