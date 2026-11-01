import React, { useState } from 'react';
import { getCurrentDeviceLocation, isGeolocationSupported } from '../../services/geolocationService.js';
import './DeviceGpsTester.css';

/**
 * DeviceGpsTester Component (Phase 6)
 *
 * An interactive educational tool allowing the learner to test their
 * device's real hardware GPS via the HTML5 Geolocation API.
 */
export default function DeviceGpsTester({ onUseDeviceLocation }) {
  const [gpsData, setGpsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestGps = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentDeviceLocation();
      setGpsData(location);
    } catch (err) {
      setError(err.message);
      setGpsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToMap = () => {
    if (gpsData && onUseDeviceLocation) {
      onUseDeviceLocation({ lat: gpsData.lat, lng: gpsData.lng });
    }
  };

  const supported = isGeolocationSupported();

  return (
    <div className="device-gps-tester-card">
      <div className="gps-tester-header">
        <div className="gps-tester-title">
          <span className="gps-tester-icon">📡</span>
          <h4>Phase 6: Real Device GPS Inspector</h4>
        </div>
        <span className="gps-status-badge">
          {supported ? 'HTML5 Geolocation Available' : 'Not Supported'}
        </span>
      </div>

      <p className="gps-tester-desc">
        Test how real delivery partner smartphones acquire GPS fixes using <code>navigator.geolocation</code>.
        Click below to request your device's actual satellite/Wi-Fi coordinates.
      </p>

      <div className="gps-actions-row">
        <button
          className="gps-btn primary-gps-btn"
          onClick={handleTestGps}
          disabled={loading || !supported}
        >
          {loading ? '🛰️ Querying Device GPS...' : '📍 Request My Real Device Location'}
        </button>

        {gpsData && onUseDeviceLocation && (
          <button className="gps-btn apply-gps-btn" onClick={handleApplyToMap}>
            🗺️ Set As Map Driver Location
          </button>
        )}
      </div>

      {/* GPS Output Readout */}
      {gpsData && (
        <div className="gps-telemetry-box">
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="tel-label">Latitude:</span>
              <span className="tel-value">{gpsData.lat.toFixed(6)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="tel-label">Longitude:</span>
              <span className="tel-value">{gpsData.lng.toFixed(6)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="tel-label">Accuracy:</span>
              <span className="tel-value">&plusmn;{gpsData.accuracyMeters} meters</span>
            </div>
            <div className="telemetry-item">
              <span className="tel-label">Timestamp:</span>
              <span className="tel-value">
                {new Date(gpsData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied or Error Notice */}
      {error && (
        <div className="gps-error-box">
          <strong>❌ Geolocation Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

