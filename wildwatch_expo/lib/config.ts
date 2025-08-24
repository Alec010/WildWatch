// Configuration file for WildWatch Expo app
export const config = {
  // Backend API configuration
  API: {
    BASE_URL: 'http://192.168.1.28:8080/api',
    TIMEOUT: 30000, // 30 seconds
  },
  
  // Microsoft OAuth configuration
  MICROSOFT: {
    CLIENT_ID: '39e32928-3be0-4723-b913-0ddd50c5d205',
    TENANT_ID: '823cde44-4433-456d-b801-bdf0ab3d41fc',
    SCOPES: ['openid', 'profile', 'email'],
    REDIRECT_URI: 'wildwatchexpo://auth/oauth2/callback',
  },
  
  // App configuration
  APP: {
    NAME: 'WildWatch',
    VERSION: '1.0.0',
  }
};
