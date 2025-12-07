import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import { config } from './config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * Browser preference type
 */
export type BrowserPreference = 'chrome' | 'safari' | 'default';

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
 * Opens Microsoft OAuth in the specified browser
 * The user will complete OAuth on the web, then be redirected back to the app via deep link
 * @param browserPreference - The browser to use: 'chrome', 'safari', or 'default'
 */
export const openMicrosoftOAuth = async (browserPreference: BrowserPreference = 'default'): Promise<void> => {
  try {
    // Get the backend URL
    const backendUrl = config.API.BASE_URL.replace('/api', ''); // Remove /api suffix

    // Construct the OAuth URL WITHOUT mobile_redirect_uri in state
    // This ensures the backend redirects to the frontend OAuth handler first (not directly to app)
    // Flow: Backend OAuth -> Frontend OAuth2Redirect -> mobile/terms -> mobile/setup -> mobile/complete -> app deep link
    // The backend will redirect to the frontend's OAuth handler after Microsoft OAuth completes
    // The frontend OAuth2Redirect component will detect mobile device and route to mobile/terms
    // mobile/complete will then redirect to the app via deep link
    // Note: We don't include mobile_redirect_uri to prevent backend from redirecting directly to app
    const stateData = JSON.stringify({
      source: 'mobile_app' // Indicate this is from mobile app to ensure mobile web flow
    });
    const state = base64Encode(stateData);

    // Construct OAuth URL - backend will handle Microsoft OAuth and redirect to frontend
    // The frontend OAuth2Redirect will detect mobile and route through mobile/terms -> mobile/setup -> mobile/complete
    // mobile/complete will redirect to the app via deep link: wildwatchexpo://auth/oauth2/callback?token=...
    // Add prompt=select_account to force account selection screen for mobile web OAuth
    const oauthUrl = `${backendUrl}/oauth2/authorization/microsoft?state=${encodeURIComponent(state)}&prompt=select_account`;

    console.log(`🔗 Opening Microsoft OAuth in ${browserPreference} browser`);
    console.log(`📱 OAuth URL: ${oauthUrl}`);
    console.log(`📱 Flow: Microsoft OAuth -> Frontend OAuth2Redirect -> mobile/terms -> mobile/setup -> mobile/complete -> App`);

    // Open in the selected browser
    if (browserPreference === 'chrome') {
      // Chrome-specific handling
      if (Platform.OS === 'ios') {
        // iOS: Try multiple Chrome URL schemes
        // Chrome uses googlechromes:// for HTTPS and googlechrome:// for HTTP
        const urlWithoutProtocol = oauthUrl.replace(/^https?:\/\//, '');

        // Try HTTPS scheme first (googlechromes://) - this is the standard for HTTPS URLs
        const chromeUrlHttps = `googlechromes://${urlWithoutProtocol}`;
        // Try HTTP scheme as fallback (googlechrome://)
        const chromeUrlHttp = `googlechrome://${urlWithoutProtocol}`;

        try {
          // Try to open with HTTPS scheme first
          await Linking.openURL(chromeUrlHttps);
          console.log('✅ Opened Chrome with HTTPS scheme:', chromeUrlHttps);
        } catch (error1) {
          console.log('⚠️ HTTPS scheme failed, trying HTTP scheme:', error1);
          try {
            // Fallback to HTTP scheme
            await Linking.openURL(chromeUrlHttp);
            console.log('✅ Opened Chrome with HTTP scheme:', chromeUrlHttp);
          } catch (error2) {
            // If both fail, Chrome might not be installed - fallback to default browser
            // Use Linking.openURL to open in external browser (not popup)
            console.log('❌ Chrome schemes failed, falling back to default browser', error2);
            await Linking.openURL(oauthUrl);
          }
        }
      } else if (Platform.OS === 'android') {
        // Android: Use intent URL to open in Chrome
        // Format: intent://URL#Intent;scheme=https;package=com.android.chrome;end
        const urlWithoutProtocol = oauthUrl.replace(/^https?:\/\//, '');

        // Properly encode the URL for the intent
        const encodedUrl = encodeURIComponent(oauthUrl);

        // Method 1: Standard Chrome intent format
        const chromeIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodedUrl};end`;

        try {
          // Try to open Chrome directly
          await Linking.openURL(chromeIntent);
          console.log('✅ Opened Chrome with intent URL:', chromeIntent);
        } catch (error) {
          console.log('⚠️ Method 1 failed, trying alternative:', error);
          // If intent fails, try alternative method
          try {
            // Method 2: Alternative intent format with explicit action
            const altIntent = `intent://${urlWithoutProtocol}#Intent;package=com.android.chrome;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodedUrl};end`;
            await Linking.openURL(altIntent);
            console.log('✅ Opened Chrome with alternative intent');
          } catch (error2) {
            console.log('⚠️ Method 2 failed, trying simple intent:', error2);
            // Method 3: Try without fallback URL
            try {
              const simpleIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
              await Linking.openURL(simpleIntent);
              console.log('✅ Opened Chrome with simple intent');
            } catch (error3) {
              // If all methods fail, Chrome might not be installed - fallback to default browser
              // Use Linking.openURL to open in external browser (not popup)
              console.log('❌ All Chrome intent methods failed, falling back to default browser', error3);
              await Linking.openURL(oauthUrl);
            }
          }
        }
      } else {
        // Web or other platforms - use Linking to open in external browser
        await Linking.openURL(oauthUrl);
      }
    } else if (browserPreference === 'safari') {
      // Safari-specific handling (iOS only)
      if (Platform.OS === 'ios') {
        // iOS: Use Safari by opening with https:// which defaults to Safari
        // Or use x-safari-https:// scheme if available
        try {
          const safariUrl = `x-safari-https://${oauthUrl.replace(/^https?:\/\//, '')}`;
          const canOpen = await Linking.canOpenURL(safariUrl);
          if (canOpen) {
            await Linking.openURL(safariUrl);
          } else {
            // Fallback to regular https which will open in Safari on iOS
            await Linking.openURL(oauthUrl);
          }
        } catch {
          // Fallback to regular https
          await Linking.openURL(oauthUrl);
        }
      } else {
        // Android or other platforms - Safari not available, use default
        // Use Linking.openURL to open in external browser (not popup)
        console.log('Safari not available on this platform, using default browser');
        await Linking.openURL(oauthUrl);
      }
    } else {
      // Default browser - use Linking.openURL to open in external browser (not popup)
      // This ensures it opens directly in the browser app, not as a modal/popup
      await Linking.openURL(oauthUrl);
    }

    // Note: The browser will handle the OAuth flow
    // When complete, the web will redirect to wildwatchexpo://auth/oauth2/callback?token=...
    // This deep link will be caught by the callback handler
  } catch (error) {
    console.error('Error opening Microsoft OAuth:', error);
    throw error;
  }
};

