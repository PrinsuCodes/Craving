import React from 'react';
import { formatDistance, formatDuration, calculateArrivalTime } from './etaUtils.js';
import './DeliveryEtaCard.css';

/**
 * DeliveryEtaCard Component (Phase 4)
 *
 * Displays:
 * 1. Estimated Arrival Time (minutes).
 * 2. Remaining road distance (km).
 * 3. Approximate arrival clock time.
 * 4. Main street route summary.
 * 5. Important traffic disclaimer regarding OSRM calculations.
 */
export default function DeliveryEtaCard({
  distanceMeters,
  durationSeconds,
  summary,
  status = 'success', // 'loading' | 'success' | 'error' | 'idle'
  error = null,
}) {
  const formattedDistance = formatDistance(distanceMeters);
  const formattedDuration = formatDuration(durationSeconds);
  const arrivalClockTime = calculateArrivalTime(durationSeconds);

  return (
    <div className={`delivery-eta-card ${status === 'loading' ? 'eta-loading' : ''}`}>
      <div className="eta-main-row">
        {/* Left: ETA Badge */}
        <div className="eta-badge-block">
          <div className="eta-icon-circle">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <span className="eta-label">Estimated Delivery</span>
            <h3 className="eta-value">
              {status === 'loading' && <span className="shimmer-text">Calculating...</span>}
              {status === 'error' && <span className="eta-error-text">Unavailable</span>}
              {status === 'success' && formattedDuration}
              {status === 'idle' && '--'}
            </h3>
          </div>
        </div>

        {/* Middle: Distance Metric */}
        <div className="eta-metric-block">
          <span className="metric-label">Distance Remaining</span>
          <p className="metric-value">
            {status === 'loading' ? '...' : formattedDistance}
          </p>
        </div>

        {/* Right: Arrival Clock Time */}
        <div className="eta-metric-block arrival-clock-block">
          <span className="metric-label">Arriving Around</span>
          <p className="metric-value">
            {status === 'loading' ? '...' : (arrivalClockTime || '--')}
          </p>
        </div>
      </div>

      {/* Street Summary & Traffic Disclaimer */}
      <div className="eta-footer-row">
        {summary && status === 'success' && (
          <span className="eta-summary-tag">
            🛣️ Via {summary}
          </span>
        )}
        {status === 'error' && (
          <span className="eta-error-notice">
            ⚠️ {error || 'Unable to compute road ETA. Showing direct coordinates.'}
          </span>
        )}
        <span className="eta-traffic-note">
          ℹ️ <strong>Traffic Note:</strong> OSRM routes are based on standard road speed limits and do not account for live traffic jams.
        </span>
      </div>
    </div>
  );
}