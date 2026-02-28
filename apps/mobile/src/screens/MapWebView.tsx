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
  isDark: boolean,
  primary: string,
  primarySoft: string,
  surface: string,
  surfaceMuted: string,
  borderSubtle: string,
  textMain: string,
  textSecondary: string,
  success: string,
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
      label: c.detections[0]?.label ?? 'Unknown',
      initial: (c.detections[0]?.label ?? 'U')[0],
      count: c.detections.length,
      animals: c.detections.map((d) => d.label).join(', ') || '—',
      score: c.detections[0]?.score ?? 0,
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
    #map { width: 100%; height: 100%; }
    .custom-icon { background: none !important; border: none !important; }
    .photo-marker {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: ${surface};
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: ${primary};
      overflow: hidden;
    }
    .cluster-marker {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${primary};
      border: 2px solid rgba(255,255,255,0.6);
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #fff;
    }
    .leaflet-popup-content-wrapper {
      background: ${surface};
      border: 1px solid ${borderSubtle};
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      overflow: hidden;
    }
    .leaflet-popup-tip { background: ${surface}; }
    .leaflet-popup-content {
      margin: 0;
      min-width: 200px;
      color: ${textMain};
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .popup-inner { padding: 14px; }
    .popup-species { font-weight: 700; font-size: 16px; color: ${textMain}; margin-bottom: 4px; }
    .popup-badge {
      display: inline-block;
      background: ${primarySoft};
      color: ${primary};
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      margin-right: 6px;
    }
    .popup-meta { font-size: 12px; color: ${textSecondary}; margin-top: 6px; }
    .popup-confidence { margin-top: 8px; }
    .popup-bar-bg { height: 4px; background: ${borderSubtle}; border-radius: 2px; overflow: hidden; }
    .popup-bar-fill { height: 100%; background: ${success}; border-radius: 2px; }
    .popup-score { font-size: 12px; font-weight: 700; color: ${success}; margin-top: 2px; }
    .leaflet-control-zoom { display: none; }
    .leaflet-control-attribution {
      background: transparent !important;
      color: ${textSecondary} !important;
      font-size: 9px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const captures = ${capturesJson};
    const map = L.map('map', { zoomControl: false }).setView([45.5, -73.5], 4);
    L.tileLayer('${tileUrl}', {
      attribution: '© OpenStreetMap © CARTO'
    }).addTo(map);
    captures.forEach(function(c) {
      var iconHtml;
      if (c.count > 1) {
        iconHtml = '<div class="cluster-marker">' + c.count + '</div>';
      } else {
        iconHtml = '<div class="photo-marker">' + c.initial + '</div>';
      }
      var icon = L.divIcon({
        className: 'custom-icon',
        html: iconHtml,
        iconSize: c.count > 1 ? [36, 36] : [44, 44],
        iconAnchor: c.count > 1 ? [18, 18] : [22, 22]
      });
      var marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(map);
      var pct = Math.round(c.score * 100);
      var popup = '<div class="popup-inner">' +
        '<div class="popup-species">' + c.label + '</div>' +
        '<div><span class="popup-badge">SPECIES</span></div>' +
        '<div class="popup-meta">' + c.source + ' · ' + c.when + '</div>' +
        '<div class="popup-confidence">' +
          '<div class="popup-bar-bg"><div class="popup-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="popup-score">' + pct + '% confidence</div>' +
        '</div>' +
      '</div>';
      marker.bindPopup(popup, { closeButton: false });
    });
  </script>
</body>
</html>`;
}

export function MapWebView() {
  const { tokens, isDark } = useTheme();
  const { colors } = tokens;

  const html = useMemo(
    () =>
      buildMapHtml(
        DUMMY_CAPTURES,
        isDark,
        colors.primary,
        colors.primarySoft,
        colors.surface,
        colors.surfaceMuted,
        colors.borderSubtle,
        colors.textMain,
        colors.textSecondary,
        colors.success,
        colors.bg
      ),
    [colors, isDark]
  );

  return (
    <View style={styles.container}>
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
