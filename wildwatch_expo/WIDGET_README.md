# WildWatch Android Widget Implementation

This document explains how the WildWatch Android widget has been implemented and how to use it.

## Overview

The WildWatch app now includes two Android home screen widgets:

1. **WildWatch Dashboard Widget** - Shows statistics and recent activity
2. **WildWatch Quick Report Widget** - Quick access to report incidents

## Widget Features

### Dashboard Widget
- **Statistics Display**: Shows total reports, pending, in progress, and resolved counts
- **Recent Activity**: Displays the latest 2 incidents with status and location
- **Auto-refresh**: Updates every 30 minutes
- **Main Action**: **Tap anywhere on widget** → Opens directly to Report tab
- **Secondary Actions**: Tap refresh icon to update data, tap incidents to view details

### Quick Report Widget
- **Compact Design**: Small 2x1 widget for quick access
- **Main Action**: **Tap anywhere on widget** → Opens directly to Report tab
- **Visual Indicators**: Clear "Tap to Report Incident" text and arrow icons

## Technical Implementation

### Files Structure
```
src/widgets/
├── WildWatchDashboardWidget.tsx    # Main dashboard widget component
├── WildWatchQuickReportWidget.tsx  # Quick report widget component
├── widgetDataService.ts            # Data fetching and caching service
└── widgetTaskHandler.tsx           # Widget event handler

app.config.ts                       # Expo configuration with widget settings
index.js                           # Entry point with widget registration
```

### Key Components

#### WidgetDataService
- Fetches data from your existing API endpoints
- Implements 30-minute caching for performance
- Handles authentication and error states
- Provides fallback data when offline

#### WidgetTaskHandler
- Manages widget lifecycle events (add, update, delete)
- Handles user interactions (clicks, taps)
- Routes users to appropriate app screens
- Manages data refresh and rendering

### Configuration

The widgets are configured in `app.config.ts`:

```typescript
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
```

## Building and Testing

### Development Build
Since widgets require native code, you need to create a development build:

```bash
# Prebuild the native code
npx expo prebuild --platform android

# Build and run on device/emulator
npx expo run:android
```

### Production Build
For production builds, use EAS Build:

```bash
# Build for production
eas build --platform android
```

## Adding Widgets to Home Screen

1. **Long-press** on your Android home screen
2. Select **"Widgets"** from the menu
3. Find **"WildWatch"** in the widget list
4. Choose either:
   - **WildWatch Dashboard** (4x2 size)
   - **WildWatch Quick Report** (2x1 size)
5. **Drag and drop** the widget to your desired location

## Widget Interactions

### Dashboard Widget
- **Tap anywhere on widget**: Opens directly to Report tab
- **Tap refresh icon**: Updates widget data (stops propagation)
- **Tap recent incident**: Opens specific incident details (stops propagation)

### Quick Report Widget
- **Tap anywhere on widget**: Opens directly to Report tab
- **Visual feedback**: Shows "Tap to Report Incident" text and arrow indicators

## Data Sources

The widgets use your existing API endpoints:
- `/incidents/my` - User's incident reports
- `/incidents/public` - Public incidents for recent activity
- Authentication handled via existing token storage

## Customization

### Styling
Widget components use inline styles that match your app's design:
- Primary color: `#8B0000` (dark red)
- Status colors: Pending (orange), In Progress (blue), Resolved (green)
- Material Design principles

### Data Refresh
- **Automatic**: Every 30 minutes (dashboard) or 1 hour (quick report)
- **Manual**: Tap refresh button on dashboard widget
- **Cache**: 30-minute local cache for offline access

### Size Options
- **Dashboard**: 4x2 cells (recommended), can be resized
- **Quick Report**: 2x1 cells (fixed size)

## Troubleshooting

### Widget Not Appearing
1. Ensure you've built with `expo prebuild`
2. Check that the widget is properly registered in `app.config.ts`
3. Verify the preview image exists at the specified path

### Data Not Loading
1. Check network connectivity
2. Verify user authentication
3. Check console logs for API errors
4. Widget will show cached data if available

### Widget Not Updating
1. Check if auto-update is enabled in Android settings
2. Manually refresh by tapping the refresh button
3. Remove and re-add the widget

## Future Enhancements

Potential improvements for future versions:
- **Push notifications** integration
- **Location-based** quick reporting
- **Emergency contact** quick dial
- **Campus alerts** display
- **Customizable** widget themes
- **Multiple size** options

## Support

For issues with the widget implementation:
1. Check the console logs for error messages
2. Verify API endpoints are accessible
3. Test with a fresh app installation
4. Check Android widget permissions

The widget implementation follows Android's best practices and integrates seamlessly with your existing WildWatch app architecture.
