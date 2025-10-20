declare module 'react-native-android-widget' {
  import { ReactNode } from 'react';

  export interface WidgetTaskHandlerProps {
    widgetName: string;
    widgetAction: 'WIDGET_ADDED' | 'WIDGET_DELETED' | 'WIDGET_UPDATE' | 'WIDGET_RESIZED' | 'WIDGET_CLICKED';
    widgetId: string;
    clickAction?: string;
    clickActionData?: any;
    renderWidget: (component: ReactNode) => void;
    openApp: (route?: string) => void;
  }

  export interface WithAndroidWidgetsParams {
    widgets: Array<{
      name: string;
      label: string;
      minWidth: string;
      minHeight: string;
      targetCellWidth: number;
      targetCellHeight: number;
      description: string;
      previewImage: string;
      updatePeriodMillis: number;
    }>;
  }

  export function registerWidgetTaskHandler(handler: (props: WidgetTaskHandlerProps) => Promise<void>): void;
}
