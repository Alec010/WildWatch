import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { config } from './config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Create the OAuth request
const createMicrosoftAuthRequest = () => {
  // Use the redirect URI from config, which should match the .env file
  const redirectUri = config.MICROSOFT.REDIRECT_URI;
  
  console.log('Using redirect URI from config:', redirectUri);
  console.log('Make sure this URI is configured in your Azure App Registration!');

  return new AuthSession.AuthRequest({
    clientId: config.MICROSOFT.CLIENT_ID,
    scopes: config.MICROSOFT.SCOPES,
    redirectUri: redirectUri,
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
      console.log('Client ID:', config.MICROSOFT.CLIENT_ID);
      console.log('Tenant ID:', config.MICROSOFT.TENANT_ID);
      
      const request = createMicrosoftAuthRequest();
      console.log('Auth request created, code verifier:', request.codeVerifier ? 'Present' : 'Missing');
      
      const result = await request.promptAsync({
        authorizationEndpoint: `https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/authorize`
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        // Exchange the authorization code for tokens
        return await microsoftOAuthService.exchangeCodeForTokens(result.params.code, request.codeVerifier);
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
  exchangeCodeForTokens: async (code: string, codeVerifier?: string) => {
    try {
      console.log('Exchanging authorization code for tokens with Microsoft...');
      console.log('Code verifier:', codeVerifier ? 'Present' : 'Missing');
      console.log('Client ID:', config.MICROSOFT.CLIENT_ID);
      console.log('Tenant ID:', config.MICROSOFT.TENANT_ID);
      
      // Exchange code directly with Microsoft
      const bodyString = `client_id=${encodeURIComponent(config.MICROSOFT.CLIENT_ID)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(config.MICROSOFT.REDIRECT_URI)}&grant_type=authorization_code${codeVerifier ? `&code_verifier=${encodeURIComponent(codeVerifier)}` : ''}`;

      console.log('Token exchange body:', bodyString);

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Microsoft token exchange failed:', errorText);
        console.error('Request details:', {
          url: `https://login.microsoftonline.com/${config.MICROSOFT.TENANT_ID}/oauth2/v2.0/token`,
          client_id: config.MICROSOFT.CLIENT_ID,
          redirect_uri: 'wildwatchexpo://auth/oauth2/callback',
          code_length: code.length
        });
        throw new Error(`Microsoft token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Microsoft token exchange successful');

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
      console.log('User info from Microsoft:', userInfo);

      // Send the Microsoft access token to your backend for validation and JWT generation
      const backendResponse = await fetch(`${config.API.BASE_URL}/auth/oauth2/microsoft-token`, {
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
        throw new Error(`Backend validation failed: ${backendResponse.status}`);
      }

      const backendData = await backendResponse.json();
      console.log('Backend validation successful:', backendData);
      
      return backendData;
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


