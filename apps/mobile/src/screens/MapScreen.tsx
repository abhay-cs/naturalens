import Constants from 'expo-constants';
import { MapWebView } from './MapWebView';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function MapScreen() {
  if (isExpoGo) {
    return <MapWebView />;
  }

  const { MapNativeView } = require('./MapNativeView');
  return <MapNativeView />;
}
