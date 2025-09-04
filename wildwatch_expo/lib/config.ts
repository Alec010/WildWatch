// Configuration file for WildWatch Expo app
// Note: Environment variables are loaded from .env file
// If .env file doesn't exist, default values will be used

import * as AuthSession from 'expo-auth-session';

// Import environment variables with fallbacks
let API_BASE_URL: string | undefined;
let API_TIMEOUT: string | undefined;
let MICROSOFT_CLIENT_ID: string | undefined;
let MICROSOFT_TENANT_ID: string | undefined;
let MICROSOFT_REDIRECT_URI: string | undefined;
let APP_NAME: string | undefined;
let APP_VERSION: string | undefined;

try {
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
  API_TIMEOUT = env.API_TIMEOUT;
  MICROSOFT_CLIENT_ID = env.MICROSOFT_CLIENT_ID;
  MICROSOFT_TENANT_ID = env.MICROSOFT_TENANT_ID;
  MICROSOFT_REDIRECT_URI = env.MICROSOFT_REDIRECT_URI;
  APP_NAME = env.APP_NAME;
  APP_VERSION = env.APP_VERSION;
} catch (error) {
  // Environment variables not available, will use defaults
  console.warn('Environment variables not loaded, using default values');
}

export const config = {
  // Backend API configuration
  API: {
    BASE_URL: API_BASE_URL || 'http://192.168.1.5:8080/api',
    TIMEOUT: API_TIMEOUT ? parseInt(API_TIMEOUT) : 30000, // 30 seconds
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
  
  // App configuration
  APP: {
    NAME: APP_NAME || 'WildWatch',
    VERSION: APP_VERSION || '1.0.0',
  }
};
