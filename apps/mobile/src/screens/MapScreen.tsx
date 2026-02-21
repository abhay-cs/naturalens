import Constants from 'expo-constants';
import { MapWebView } from './MapWebView';

/** In Expo Go, react-native-maps native module isn't available. Use WebView map. In dev builds, use native map. */
const isExpoGo = Constants.appOwnership === 'expo';

export function MapScreen() {
  if (isExpoGo) {
    return <MapWebView />;
  }
  const { MapNativeView } = require('./MapNativeView');
  return <MapNativeView />;
}
