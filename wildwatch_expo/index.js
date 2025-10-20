import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// Register the main app
registerRootComponent(App);

// Register the widget task handler
registerWidgetTaskHandler(widgetTaskHandler);
