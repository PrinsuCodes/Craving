/**
 * Geolocation Service (Phase 6 & Live Driver GPS)
 *
 * Wraps the standard HTML5 Geolocation API (`navigator.geolocation`).
 * Provides methods for:
 * 1. Checking browser support & permissions.
 * 2. Getting current one-time GPS fix (`getCurrentPosition`).
 * 3. Continuous GPS streaming (`watchPosition`) with automatic desktop/mobile fallbacks.
 * 4. Human-readable error translation (Permission Denied, Timeout, Unavailable).
 */

export const GEOLOCATION_ERRORS = {
  NOT_SUPPORTED: 'Geolocation is not supported by your browser or operating system.',
  PERMISSION_DENIED: 'Location permission was denied. Please allow location access in your browser settings.',
  POSITION_UNAVAILABLE: 'GPS position is currently unavailable. Check your device satellite or network connection.',
  TIMEOUT: 'Location request timed out. Retrying with network/WiFi location...',
};

/**
 * Checks if geolocation is supported in the current browser/environment.
 */
export function isGeolocationSupported() {
  return typeof window !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Request GPS fix from the device.
 * Automatically tries high-accuracy first (satellite GPS on mobile),
 * and falls back to standard accuracy (WiFi/network on desktop) if high accuracy times out.
 *
 * @param {Object} options - GeolocationOptions
 * @returns {Promise<Object>} Resolves with { lat, lng, accuracyMeters, heading, speedMps, timestamp, isHighAccuracy }
 */
export function getCurrentDeviceLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error(GEOLOCATION_ERRORS.NOT_SUPPORTED));
      return;
    }

    const tryGetPosition = (highAccuracy = true) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: Math.round(position.coords.accuracy),
            heading: position.coords.heading,
            speedMps: position.coords.speed,
            timestamp: position.timestamp,
            isHighAccuracy: highAccuracy,
          });
        },
        (error) => {
          // If high accuracy times out or is unavailable on desktop, fall back to standard WiFi/network accuracy
          if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            console.warn('[Geolocation] High accuracy single fix timed out. Retrying with standard WiFi/network accuracy...');
            tryGetPosition(false);
            return;
          }

          let message = 'An unknown geolocation error occurred.';
          if (error.code === error.PERMISSION_DENIED) message = GEOLOCATION_ERRORS.PERMISSION_DENIED;
          else if (error.code === error.POSITION_UNAVAILABLE) message = GEOLOCATION_ERRORS.POSITION_UNAVAILABLE;
          else if (error.code === error.TIMEOUT) message = GEOLOCATION_ERRORS.TIMEOUT;
          reject(new Error(message));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 15000,
          maximumAge: 5000,
          ...options,
        }
      );
    };

    tryGetPosition(options.enableHighAccuracy ?? true);
  });
}

/**
 * Continuously watch GPS position updates.
 * Robustly handles high accuracy timeouts on desktops by falling back to standard network triangulation.
 *
 * @param {Function} onUpdate - Callback called with { lat, lng, accuracyMeters, ... }
 * @param {Function} onError - Callback called on error
 * @param {Object} options - GeolocationOptions
 * @returns {Function} Unsubscribe cleanup function
 */
export function watchDeviceLocation(onUpdate, onError, options = {}) {
  if (!isGeolocationSupported()) {
    if (onError) onError(new Error(GEOLOCATION_ERRORS.NOT_SUPPORTED));
    return () => {};
  }

  let isCancelled = false;
  let watchId = null;

  const startWatch = (highAccuracy = true) => {
    if (isCancelled) return;

    const watchOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 8000 : 15000,
      maximumAge: 3000,
      ...options,
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (isCancelled) return;
        onUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy),
          heading: position.coords.heading,
          speedMps: position.coords.speed,
          timestamp: position.timestamp,
          isHighAccuracy: highAccuracy,
        });
      },
      (error) => {
        if (isCancelled) return;

        // If high accuracy times out or is unavailable on desktop, retry with WiFi/network triangulation
        if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
          console.warn('[Geolocation] High accuracy watch timed out. Falling back to standard WiFi/network accuracy...');
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          startWatch(false);
          return;
        }

        if (onError) {
          let message = 'Location watch error';
          if (error.code === error.PERMISSION_DENIED) message = GEOLOCATION_ERRORS.PERMISSION_DENIED;
          else if (error.code === error.POSITION_UNAVAILABLE) message = GEOLOCATION_ERRORS.POSITION_UNAVAILABLE;
          else if (error.code === error.TIMEOUT) message = GEOLOCATION_ERRORS.TIMEOUT;
          onError(new Error(message));
        }
      },
      watchOptions
    );
  };

  startWatch(options.enableHighAccuracy ?? true);

  return () => {
    isCancelled = true;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
