import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { config } from './config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Create the OAuth request
const createMicrosoftAuthRequest = () => {
  // Use AuthSession.makeRedirectUri for proper deep linking
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'wildwatchexpo',
    path: 'auth/oauth2/callback'
  });

  console.log('Using redirect URI:', redirectUri);
  console.log('Make sure this URI is configured in your Azure app registration!');

  return new AuthSession.AuthRequest({
    clientId: config.MICROSOFT.CLIENT_ID,
    scopes: config.MICROSOFT.SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      prompt: 'select_account'
    }
  });
};

// Microsoft OAuth service
export const microsoftOAuthService = {
  // Sign in with Microsoft
  signInWithMicrosoft: async () => {
    try {
      console.log('Starting Microsoft OAuth flow...');
      
      const request = createMicrosoftAuthRequest();
      const result = await request.promptAsync({
        authorizationEndpoint: `https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/authorize`
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        // Exchange the authorization code for tokens
        return await microsoftOAuthService.exchangeCodeForTokens(result.params.code);
      } else if (result.type === 'cancel') {
        throw new Error('User cancelled OAuth flow');
      } else {
        throw new Error(`OAuth failed: ${result.type}`);
      }
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      throw error;
    }
  },

  // Exchange authorization code for tokens
  exchangeCodeForTokens: async (code: string) => {
    try {
      console.log('Exchanging authorization code for tokens...');
      
      // For now, we'll send the code to your backend
      // Your backend will handle the token exchange
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), config.API.TIMEOUT);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${config.API.BASE_URL}/auth/oauth2/microsoft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        }),
        timeoutPromise
      ]) as Response;

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Token exchange successful:', data);
      
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }
};

// Helper function to get the redirect URI
export const getRedirectUri = () => {
  return config.MICROSOFT.REDIRECT_URI;
};


