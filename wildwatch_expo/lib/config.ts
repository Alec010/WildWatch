// Configuration file for WildWatch Expo app
import {
  API_BASE_URL,
  API_TIMEOUT,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_TENANT_ID,
  MICROSOFT_REDIRECT_URI,
  APP_NAME,
  APP_VERSION
} from '@env';

export const config = {
  // Backend API configuration
  API: {
    BASE_URL: API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: parseInt(API_TIMEOUT) || 30000, // 30 seconds
  },
  
  // Microsoft OAuth configuration
  MICROSOFT: {
    CLIENT_ID: MICROSOFT_CLIENT_ID || '',
    TENANT_ID: MICROSOFT_TENANT_ID || '',
    SCOPES: ['openid', 'profile', 'email'],
    REDIRECT_URI: MICROSOFT_REDIRECT_URI || 'wildwatchexpo://auth/oauth2/callback',
  },
  
  // App configuration
  APP: {
    NAME: APP_NAME || 'WildWatch',
    VERSION: APP_VERSION || '1.0.0',
  }
};
