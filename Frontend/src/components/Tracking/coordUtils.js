/**
 * Coordinate Utility Functions
 *
 * Normalizes coordinates from various formats:
 * - Array: [lat, lng]
 * - Object: { lat, lng } or { latitude, longitude }
 */
export const normalizeCoords = (coords) => {
  if (!coords) return null;
  if (Array.isArray(coords) && coords.length >= 2) {
    return [Number(coords[0]), Number(coords[1])];
  }
  if (typeof coords === 'object') {
    const lat = coords.lat !== undefined ? coords.lat : coords.latitude;
    const lng = coords.lng !== undefined ? coords.lng : coords.longitude;
    if (lat !== undefined && lng !== undefined) {
      return [Number(lat), Number(lng)];
    }
  }
  return null;
};

