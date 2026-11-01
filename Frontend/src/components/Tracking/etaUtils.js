/**
 * ETA & Distance Utility Functions
 */

/**
 * Format distance in meters to a human-readable string (e.g. "4.8 km" or "850 m")
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return '--';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to human-readable travel time (e.g. "14 mins" or "1 hr 5 mins")
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '--';
  const totalMinutes = Math.ceil(seconds / 60);

  if (totalMinutes <= 0) {
    return 'Arrived';
  }
  if (totalMinutes === 1) {
    return '1 min';
  }
  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  return `${hours} hr ${remainingMins} mins`;
}

/**
 * Calculate expected clock arrival time (e.g. "8:45 PM")
 */
export function calculateArrivalTime(durationSeconds) {
  if (!durationSeconds || isNaN(durationSeconds)) return null;
  const arrival = new Date(Date.now() + durationSeconds * 1000);
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

