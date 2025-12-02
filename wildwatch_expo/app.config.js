// app.config.js - Dynamic configuration for EAS builds
// This file reads from EAS Secrets and exposes them as environment variables
// For local development, values come from .env file
// For EAS builds, values come from EAS Secrets

module.exports = function() {
  // Read environment variables
  // EAS Secrets with EXPO_PUBLIC_ prefix are automatically available during builds
  // For local dev, .env file values are used
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const API_TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT || '30000';
  const MICROSOFT_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
  const MICROSOFT_TENANT_ID = process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID;
  const MICROSOFT_REDIRECT_URI = process.env.EXPO_PUBLIC_MICROSOFT_REDIRECT_URI;
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'WildWatch';
  const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION || '1.1.0';

  return {
    expo: {
      owner: 'katkatty21',
      name: APP_NAME,
      slug: 'wildwatch_expo',
      version: APP_VERSION,
      orientation: 'portrait',
      icon: './assets/images/logos/WildWatch_Logo.png',
      scheme: 'wildwatchexpo',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      splash: {
        image: './assets/images/logos/WildWatch_Logo.png',
        backgroundColor: '#000000',
        resizeMode: 'cover'
      },
      ios: {
        bundleIdentifier: 'com.wildwatch.app',
        buildNumber: '2',
        supportsTablet: true,
        infoPlist: {
          NSCameraUsageDescription: 'WildWatch needs access to your camera to capture evidence photos for incident reports.',
          NSPhotoLibraryUsageDescription: 'WildWatch needs access to your photo library to attach evidence images to reports.',
          NSLocationWhenInUseUsageDescription: 'WildWatch needs your location to accurately report incident locations on campus.',
          NSLocationAlwaysAndWhenInUseUsageDescription: 'WildWatch needs your location to accurately report incident locations on campus.'
        }
      },
      android: {
        package: 'com.wildwatch.app',
        versionCode: 2,
        adaptiveIcon: {
          foregroundImage: './assets/images/logos/WildWatch_Logo.png'
        },
        edgeToEdgeEnabled: true,
        permissions: [
          'INTERNET',
          'ACCESS_NETWORK_STATE',
          'CAMERA',
          // Storage permissions for Android 12 and below
          'READ_EXTERNAL_STORAGE',
          'WRITE_EXTERNAL_STORAGE',
          // Media permissions for Android 13+ (API 33+)
          'READ_MEDIA_IMAGES',
          'READ_MEDIA_VIDEO',
          // Location permissions (foreground only)
          'ACCESS_FINE_LOCATION',
          'ACCESS_COARSE_LOCATION'
        ]
      },
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png'
      },
      plugins: [
        'expo-router',
        'expo-web-browser',
        [
          'expo-image-picker',
          {
            photosPermission: 'WildWatch needs access to your photos to attach evidence images to incident reports.',
            cameraPermission: 'WildWatch needs access to your camera to capture evidence photos for incident reports.'
          }
        ],
        [
          'expo-location',
          {
            locationAlwaysAndWhenInUsePermission: 'WildWatch needs your location to accurately report incident locations on campus.'
          }
        ],
        'expo-notifications'
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        router: {},
        eas: {
          projectId: 'caa0082a-c5b9-40b8-a537-d58e57bf8b4c'
        }
      }
    }
  };
};
