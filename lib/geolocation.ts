export type CapturedLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

function mapGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Allow location access in your browser or device settings, then try again.';
    case error.POSITION_UNAVAILABLE:
      return 'Location is unavailable. Turn on GPS/location services and try again.';
    case error.TIMEOUT:
      return 'Location request timed out. Move to an open area or try again.';
    default:
      return 'Could not get your location. Please try again.';
  }
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Request device location (requires HTTPS except localhost).
 * Tries high-accuracy first, then falls back to network/cached position.
 */
export async function captureTrainerLocation(): Promise<CapturedLocation> {
  if (typeof window === 'undefined') {
    throw new Error('Location is only available in the browser.');
  }

  if (!window.isSecureContext) {
    throw new Error(
      'Location requires a secure connection. Open the app via https://erp.robochamps.in (not plain HTTP).'
    );
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device or browser.');
  }

  const highAccuracy: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
  };

  const fallback: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 25000,
    maximumAge: 120000,
  };

  try {
    const pos = await getPosition(highAccuracy);
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  } catch (firstError) {
    const geoErr = firstError as GeolocationPositionError;
    if (geoErr.code === geoErr.PERMISSION_DENIED) {
      throw new Error(mapGeolocationError(geoErr));
    }
    try {
      const pos = await getPosition(fallback);
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (secondError) {
      throw new Error(mapGeolocationError(secondError as GeolocationPositionError));
    }
  }
}
