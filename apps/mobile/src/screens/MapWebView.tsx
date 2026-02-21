import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { DUMMY_CAPTURES } from '../data/dummyCaptures';
import { useTheme } from '../contexts/ThemeContext';
import type { Capture } from '../types';

function sourceLabel(source: Capture['source']): string {
  return source === 'camera' ? 'Camera' : source === 'image' ? 'Image' : 'Video';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildMapHtml(
  captures: Capture[],
  borderColor: string,
  isDark: boolean,
  accentPurple: string,
  highlight: string,
  surface: string,
  bg: string
): string {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
  const capturesJson = JSON.stringify(
    captures.map((c) => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      label: `${c.detections.length} detection(s)`,
      animals: c.detections.map((d) => d.label).join(', ') || '—',
      source: sourceLabel(c.source),
      when: formatTimestamp(c.timestamp),
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: ${bg}; }
    #map-wrapper, #map { width: 100%; height: 100%; }
    .neo-custom { background: none !important; border: none !important; }
    .neo-marker {
      background: #84cc16;
      border: 2px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 2px 2px 0 ${borderColor};
      width: 24px;
      height: 24px;
    }
    .leaflet-popup-content-wrapper {
      background: #a855f7;
      border: 2px solid ${borderColor};
      border-radius: 10px;
      box-shadow: 4px 4px 0 ${borderColor};
    }
    .leaflet-popup-content {
      margin: 12px;
      min-width: 160px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .popup-title { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
    .popup-row { font-size: 14px; margin-bottom: 4px; }
    .leaflet-tile-pane {
      filter: sepia(0.2) saturate(1.15);
    }
    .map-accent-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, ${accentPurple}30 0%, ${highlight}25 50%, ${accentPurple}25 100%);
      pointer-events: none;
      z-index: 400;
    }
    .leaflet-control-zoom a {
      background: ${surface} !important;
      color: ${borderColor} !important;
      border: 2px solid ${borderColor} !important;
      font-weight: 700 !important;
    }
    .leaflet-control-zoom a:hover {
      background: ${highlight} !important;
      color: ${surface} !important;
    }
    .leaflet-control-attribution {
      background: ${surface} !important;
      color: ${borderColor} !important;
      border-top: 2px solid ${borderColor};
      border-left: 2px solid ${borderColor};
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="map-wrapper" style="position:relative; width:100%; height:100%">
    <div id="map"></div>
    <div class="map-accent-overlay"></div>
  </div>
  <script>
    const captures = ${capturesJson};
    const map = L.map('map', { zoomControl: false }).setView([45.5, -73.5], 4);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('${tileUrl}', {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);
    const neoIcon = L.divIcon({
      className: 'neo-custom',
      html: '<div class="neo-marker"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
    captures.forEach(function(c) {
      const marker = L.marker([c.lat, c.lng], { icon: neoIcon }).addTo(map);
      const popup = '<div class="popup-title">' + c.label + '</div>' +
        '<div class="popup-row"><strong>Animals:</strong> ' + c.animals + '</div>' +
        '<div class="popup-row"><strong>Source:</strong> ' + c.source + '</div>' +
        '<div class="popup-row"><strong>When:</strong> ' + c.when + '</div>';
      marker.bindPopup(popup);
    });
  </script>
</body>
</html>`;
}

export function MapWebView() {
  const { neo, neoShadow, isDark } = useTheme();
  const html = useMemo(
    () =>
      buildMapHtml(DUMMY_CAPTURES, neo.border, isDark, neo.accentPurple, neo.highlight, neo.surface, neo.bg),
    [neo.border, neo.accentPurple, neo.highlight, neo.surface, neo.bg, isDark]
  );

  return (
    <View style={[styles.container, { borderColor: neo.border, borderWidth: 2, borderRadius: 12, overflow: 'hidden', ...neoShadow }]}>
      <WebView
        style={styles.webview}
        source={{ html, baseUrl: 'https://example.com' }}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
