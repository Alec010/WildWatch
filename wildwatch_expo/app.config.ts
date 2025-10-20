import type { ConfigContext, ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: 'WildWatchDashboard',
      label: 'WildWatch Dashboard',
      minWidth: '320dp',
      minHeight: '120dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Quick access to your safety reports and statistics',
      previewImage: './assets/images/widget-preview/widget-preview.png',
      updatePeriodMillis: 1800000, // 30 minutes
    },
    {
      name: 'WildWatchQuickReport',
      label: 'WildWatch Quick Report',
      minWidth: '160dp',
      minHeight: '80dp',
      targetCellWidth: 2,
      targetCellHeight: 1,
      description: 'Quick access to report an incident',
      previewImage: './assets/images/widget-preview/widget-preview.png',
      updatePeriodMillis: 3600000, // 1 hour
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WildWatch',
  slug: 'wildwatch_expo',
  version: '1.0.0',
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
    buildNumber: '1',
    supportsTablet: true
  },
  android: {
    package: 'com.wildwatch.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/logos/WildWatch_Logo.png'
    },
    edgeToEdgeEnabled: true
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    ['react-native-android-widget', widgetConfig]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {},
    eas: {
      projectId: '86220201-cf3e-4e5f-9bdc-73be52b8075c'
    }
  }
});
