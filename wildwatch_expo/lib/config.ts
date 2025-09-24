// Configuration file for WildWatch Expo app
// Note: Environment variables are loaded from .env file
// If .env file doesn't exist, default values will be used

import * as AuthSession from 'expo-auth-session';

// Read from Expo inlined env variables
const API_BASE_URL: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_TIMEOUT: string | undefined = process.env.EXPO_PUBLIC_API_TIMEOUT;
const MICROSOFT_CLIENT_ID: string | undefined = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
const MICROSOFT_TENANT_ID: string | undefined = process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI: string | undefined = process.env.EXPO_PUBLIC_MICROSOFT_REDIRECT_URI;
const GOOGLE_MAPS_API_KEY: string | undefined = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const APP_NAME: string | undefined = process.env.EXPO_PUBLIC_APP_NAME;
const APP_VERSION: string | undefined = process.env.EXPO_PUBLIC_APP_VERSION;

export const config = {
  // Backend API configuration
  API: {
    BASE_URL: API_BASE_URL || 'http://192.168.1.5:8080/api',
    TIMEOUT: API_TIMEOUT ? parseInt(API_TIMEOUT) : 30000,
  },
  
  // Microsoft OAuth configuration
  MICROSOFT: {
    CLIENT_ID: MICROSOFT_CLIENT_ID || '',
    TENANT_ID: MICROSOFT_TENANT_ID || '',
    SCOPES: ['openid', 'profile', 'email'],
    REDIRECT_URI: MICROSOFT_REDIRECT_URI || AuthSession.makeRedirectUri({
      scheme: 'wildwatchexpo',
      path: 'auth/oauth2/callback'
    }),
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
