import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

/**
 * Whether the device believes it can reach the network.
 *
 * "Believes" is the operative word — this reports the radio, not reachability, so a
 * captive portal or a dead uplink still reads as online. That is why it drives the
 * *banner* and never gates the shutter: `detector.ts` finding out the hard way is the
 * authoritative answer, and its message is the one the user sees.
 *
 * Starts optimistic. Assuming offline before the first check would flash a banner on every
 * cold launch.
 */
export function useNetworkOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const read = (state: Network.NetworkState) => {
      if (cancelled) return;
      // `isInternetReachable` is undefined until the OS has probed; don't call it offline
      // on the strength of a value that hasn't arrived yet.
      setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    };

    Network.getNetworkStateAsync().then(read).catch(() => undefined);
    const subscription = Network.addNetworkStateListener(read);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return online;
}
