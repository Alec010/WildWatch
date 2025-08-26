declare module '@env' {
  // Backend API Configuration
  export const API_BASE_URL: string;
  export const API_TIMEOUT: string;
  
  // Microsoft OAuth Configuration
  export const MICROSOFT_CLIENT_ID: string;
  export const MICROSOFT_TENANT_ID: string;
  export const MICROSOFT_REDIRECT_URI: string;
  
  // App Configuration
  export const APP_NAME: string;
  export const APP_VERSION: string;
}