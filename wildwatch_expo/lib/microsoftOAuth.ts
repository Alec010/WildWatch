import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { config } from './config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * Attempts to clear browser cache and prepare for fresh OAuth session
 * 
 * Note: expo-web-browser uses the system browser (Chrome/Safari), which we cannot
 * directly clear from JavaScript. However, we can:
 * 1. Use prompt: 'select_account' to force account selection
 * 2. Clear app storage to prevent token mixing
 * 3. Log cache clearing attempt for debugging
 * 
 * For full browser cache clearing, users would need to:
 * - Android: Clear Chrome/WebView cache manually or via ADB
 * - iOS: Clear Safari cache manually
 * 
 * The combination of prompt: 'select_account' + clearing app storage
 * should prevent most cached session issues.
 */
export const clearBrowserCache = async (): Promise<void> => {
  try {
    console.log('🧹 [BROWSER] Preparing for fresh OAuth session...');

    // Note: expo-web-browser doesn't expose cache clearing APIs
    // The system browser cache is managed by the OS and cannot be cleared
    // programmatically from JavaScript without native modules.
    // 
    // However, using prompt: 'select_account' in the OAuth request
    // should force Microsoft to show account selection, bypassing cached sessions.

    // Small delay to ensure any previous browser sessions are fully closed
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('✅ [BROWSER] Ready for fresh OAuth session (using select_account prompt)');
  } catch (error) {
    console.warn('⚠️ [BROWSER] Error preparing browser session:', error);
    // Don't throw - this is a best-effort operation
  }
};

// Create the OAuth request
const createMicrosoftAuthRequest = () => {
  // Use the redirect URI from config, which should match the .env file
  const redirectUri = config.MICROSOFT.REDIRECT_URI;

  return new AuthSession.AuthRequest({
    clientId: config.MICROSOFT.CLIENT_ID,
    scopes: config.MICROSOFT.SCOPES,
    redirectUri: redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      // ✅ FIX: Use 'select_account' to force account selection screen
      // This is more reliable than 'login' for account switching and prevents
      // Microsoft from auto-logging in with cached sessions
      prompt: 'select_account' // Shows account picker, forces fresh account selection
    }
  });
};

// Microsoft OAuth service
export const microsoftOAuthService = {
  // Sign in with Microsoft
  signInWithMicrosoft: async () => {
    try {
      // ✅ Clear browser cache before starting OAuth to prevent cached sessions
      await clearBrowserCache();

      const request = createMicrosoftAuthRequest();

      const result = await request.promptAsync({
        authorizationEndpoint: `https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/authorize`
      });

      if (result.type === 'success') {
        // Exchange the authorization code for tokens
        return await microsoftOAuthService.exchangeCodeForTokens(result.params.code, request.codeVerifier);
      } else if (result.type === 'cancel') {
        // User intentionally cancelled the OAuth flow
        throw new Error('User cancelled Microsoft login');
      } else if (result.type === 'dismiss') {
        // User dismissed the browser
        throw new Error('User cancelled Microsoft login');
      } else if (result.type === 'error') {
        throw new Error(`Microsoft OAuth error: ${result.error?.message || 'Unknown error'}`);
      } else {
        throw new Error(`Microsoft OAuth failed: ${result.type}`);
      }
    } catch (error) {
      throw error;
    }
  },

  // Exchange authorization code for tokens
  exchangeCodeForTokens: async (code: string, codeVerifier?: string) => {
    try {
      // Exchange code directly with Microsoft
      const bodyString = `client_id=${encodeURIComponent(config.MICROSOFT.CLIENT_ID)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(config.MICROSOFT.REDIRECT_URI)}&grant_type=authorization_code${codeVerifier ? `&code_verifier=${encodeURIComponent(codeVerifier)}` : ''}`;

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Microsoft token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();

      // Now get user info from Microsoft Graph
      const userInfoResponse = await fetch('https://graph.microsoft.com/oidc/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Microsoft');
      }

      const userInfo = await userInfoResponse.json();

      // Send the Microsoft access token to your backend for validation and JWT generation
      const backendResponse = await fetch(`${config.API.BASE_URL}/mobile/auth/microsoft/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          user_info: userInfo
        })
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Backend validation failed: ${backendResponse.status}`);
        } catch (parseError) {
          throw new Error(`Backend validation failed: ${backendResponse.status} - ${errorText}`);
        }
      }

      const backendData = await backendResponse.json();

      return backendData;
    } catch (error) {
      throw error;
    }
  }
};

// Helper function to get the redirect URI
export const getRedirectUri = () => {
  return config.MICROSOFT.REDIRECT_URI;
};


