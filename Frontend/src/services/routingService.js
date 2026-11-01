import { normalizeCoords } from '../components/Tracking/coordUtils.js';

/**
 * Routing Service using OSRM (Open Source Routing Machine)
 *
 * Public OSRM API endpoint:
 * https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
 *
 * CRITICAL NOTE ON COORDINATE ORDER:
 * - Leaflet uses: [latitude, longitude]
 * - OSRM API uses: [longitude, latitude] (GeoJSON standard)
 * We must swap coordinates when making the request, and swap them back when parsing the geometry.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export async function fetchRoadRoute(start, end, options = {}) {
  const startPos = normalizeCoords(start);
  const endPos = normalizeCoords(end);

  if (!startPos || !endPos) {
    throw new Error('Invalid start or end coordinates provided for routing.');
  }

  const [startLat, startLng] = startPos;
  const [endLat, endLng] = endPos;

  // Check if points are identical (distance ≈ 0)
  if (Math.abs(startLat - endLat) < 0.00001 && Math.abs(startLng - endLng) < 0.00001) {
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distanceMeters: 0,
      durationSeconds: 0,
      summary: 'Already at destination',
    };
  }

  // Construct OSRM URL: note {lng},{lat} order!
  const coordsParam = `${startLng},${startLat};${endLng},${endLat}`;
  const url = `${OSRM_BASE_URL}/${coordsParam}?overview=full&geometries=geojson`;

  const response = await fetch(url, {
    signal: options.signal,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OSRM routing server responded with HTTP status ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || 'No drivable route found between these coordinates.');
  }

  const bestRoute = data.routes[0];

  // OSRM GeoJSON geometry coordinates are [lng, lat].
  // Convert them to Leaflet [lat, lng]:
  const leafletCoords = bestRoute.geometry.coordinates.map((point) => [point[1], point[0]]);

  return {
    coordinates: leafletCoords, // Array of [lat, lng] for Leaflet Polyline
    distanceMeters: bestRoute.distance, // Total distance in meters
    durationSeconds: bestRoute.duration, // Estimated travel time in seconds
    summary: bestRoute.legs && bestRoute.legs[0] ? bestRoute.legs[0].summary : '',
  };
}

