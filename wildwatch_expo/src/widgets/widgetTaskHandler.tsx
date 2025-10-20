import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { WildWatchDashboardWidget } from './WildWatchDashboardWidget';
import { WildWatchQuickReportWidget } from './WildWatchQuickReportWidget';
import { widgetDataService, type WidgetData } from './widgetDataService';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName, widgetAction, widgetId } = props;

  console.log('Widget task handler called:', { widgetName, widgetAction, widgetId });

  try {
    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_RESIZED':
      case 'WIDGET_UPDATE':
        await handleWidgetUpdate(props);
        break;
      
      case 'WIDGET_DELETED':
        // Clean up any resources if needed
        console.log('Widget deleted:', widgetId);
        break;
      
      case 'WIDGET_CLICKED':
        await handleWidgetClick(props);
        break;
      
      default:
        console.log('Unknown widget action:', widgetAction);
    }
  } catch (error) {
    console.error('Widget task handler error:', error);
    // Render error state
    props.renderWidget(
      <WildWatchDashboardWidget 
        data={widgetDataService.getDefaultData()}
      />
    );
  }
}

async function handleWidgetUpdate(props: WidgetTaskHandlerProps) {
  const { widgetName } = props;
  
  // Load cached data first for quick rendering
  let widgetData = await widgetDataService.loadCachedData();
  
  // If no cached data, get default data
  if (!widgetData) {
    widgetData = widgetDataService.getDefaultData();
  }

  // Render the appropriate widget
  switch (widgetName) {
    case 'WildWatchDashboard':
      props.renderWidget(
        <WildWatchDashboardWidget 
          data={widgetData}
          onRefresh={async () => {
            try {
              const freshData = await widgetDataService.getWidgetData();
              props.renderWidget(
                <WildWatchDashboardWidget 
                  data={freshData}
                  onRefresh={async () => {
                    const refreshedData = await widgetDataService.getWidgetData();
                    props.renderWidget(
                      <WildWatchDashboardWidget 
                        data={refreshedData}
                        onRefresh={() => handleWidgetUpdate(props)}
                      />
                    );
                  }}
                />
              );
            } catch (error) {
              console.error('Failed to refresh widget data:', error);
            }
          }}
          onReportIncident={() => {
            // Open the app to the report screen
            props.openApp('/(tabs)/report');
          }}
          onViewIncident={(incidentId) => {
            // Open the app to the specific incident
            props.openApp(`/case/${incidentId}`);
          }}
          onOpenReportTab={() => {
            // Open the app directly to the report tab
            props.openApp('/(tabs)/report');
          }}
        />
      );
      break;
      
    case 'WildWatchQuickReport':
      props.renderWidget(
        <WildWatchQuickReportWidget 
          onReportIncident={() => {
            // Open the app to the report screen
            props.openApp('/(tabs)/report');
          }}
          onOpenApp={() => {
            // Open the main app
            props.openApp('/(tabs)');
          }}
          onOpenReportTab={() => {
            // Open the app directly to the report tab
            props.openApp('/(tabs)/report');
          }}
        />
      );
      break;
      
    default:
      console.warn('Unknown widget name:', widgetName);
      props.renderWidget(
        <WildWatchDashboardWidget 
          data={widgetData}
        />
      );
  }

  // Fetch fresh data in the background for next update
  try {
    const freshData = await widgetDataService.getWidgetData();
    
    // Re-render with fresh data if this is a dashboard widget
    if (widgetName === 'WildWatchDashboard') {
      props.renderWidget(
        <WildWatchDashboardWidget 
          data={freshData}
          onRefresh={async () => {
            try {
              const refreshedData = await widgetDataService.getWidgetData();
              props.renderWidget(
                <WildWatchDashboardWidget 
                  data={refreshedData}
                  onRefresh={() => handleWidgetUpdate(props)}
                />
              );
            } catch (error) {
              console.error('Failed to refresh widget data:', error);
            }
          }}
          onReportIncident={() => {
            props.openApp('/(tabs)/report');
          }}
          onViewIncident={(incidentId) => {
            props.openApp(`/case/${incidentId}`);
          }}
          onOpenReportTab={() => {
            props.openApp('/(tabs)/report');
          }}
        />
      );
    }
  } catch (error) {
    console.error('Failed to fetch fresh widget data:', error);
  }
}

async function handleWidgetClick(props: WidgetTaskHandlerProps) {
  const { clickAction, clickActionData } = props;
  
  console.log('Widget clicked:', { clickAction, clickActionData });
  
  // Handle different click actions
  switch (clickAction) {
    case 'OPEN_APP':
      props.openApp(clickActionData?.route || '/(tabs)');
      break;
      
    case 'REPORT_INCIDENT':
      props.openApp('/(tabs)/report');
      break;
      
    case 'VIEW_INCIDENT':
      if (clickActionData?.incidentId) {
        props.openApp(`/case/${clickActionData.incidentId}`);
      }
      break;
      
    default:
      // Default action - open the main app
      props.openApp('/(tabs)');
  }
}
