// Type declarations for Expo public env vars
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_API_TIMEOUT?: string;
    EXPO_PUBLIC_MICROSOFT_CLIENT_ID?: string;
    EXPO_PUBLIC_MICROSOFT_TENANT_ID?: string;
    EXPO_PUBLIC_MICROSOFT_REDIRECT_URI?: string;
    EXPO_PUBLIC_APP_NAME?: string;
    EXPO_PUBLIC_APP_VERSION?: string;
  }
}