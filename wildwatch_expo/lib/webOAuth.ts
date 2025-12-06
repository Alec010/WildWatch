import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { config } from './config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * Base64 encode for React Native (using btoa polyfill or manual encoding)
 */
const base64Encode = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  // Manual base64 encoding for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const c = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    output += chars.charAt((bitmap >> 18) & 63);
    output += chars.charAt((bitmap >> 12) & 63);
    output += i + 1 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    output += i + 2 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  return output;
};

/**
 * Opens Microsoft OAuth in web browser
 * The user will complete OAuth on the web, then be redirected back to the app via deep link
 */
export const openMicrosoftOAuth = async (): Promise<void> => {
  try {
    // Get the backend URL and construct the OAuth URL
    const backendUrl = config.API.BASE_URL.replace('/api', ''); // Remove /api suffix
    
    // Construct the OAuth URL with mobile redirect URI in state
    // The backend will detect mobile and redirect to web frontend
    // The web frontend will then redirect back to app via deep link
    const mobileRedirectUri = 'wildwatchexpo://auth/oauth2/callback';
    const stateData = JSON.stringify({ mobile_redirect_uri: mobileRedirectUri });
    const state = base64Encode(stateData);
    
    const oauthUrl = `${backendUrl}/oauth2/authorization/microsoft?state=${encodeURIComponent(state)}`;
    
    console.log('🔗 Opening Microsoft OAuth in web browser:', oauthUrl);
    
    // Open in web browser
    // The flow: App -> Backend OAuth -> Web Frontend (mobile web) -> App (deep link)
    await WebBrowser.openBrowserAsync(oauthUrl);
    
    // Note: The browser will handle the OAuth flow
    // When complete, the web will redirect to wildwatchexpo://auth/oauth2/callback?token=...
    // This deep link will be caught by the callback handler
  } catch (error) {
    console.error('Error opening Microsoft OAuth:', error);
    throw error;
  }
};

