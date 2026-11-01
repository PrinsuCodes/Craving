import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import DeliveryMarkers from './DeliveryMarkers.jsx';
import DeliveryRoute from './DeliveryRoute.jsx';
import { formatDistance, formatDuration } from './etaUtils.js';
import { normalizeCoords } from './coordUtils.js';
import {
  joinOrderTrackingRoom,
  leaveOrderTrackingRoom,
  onDriverLocationUpdate,
  onOrderStatusUpdate,
} from '../../services/socketService.js';
import './DeliveryMap.css';

/**
 * DeliveryMap Component (Phase 7)
 *
 * Updates:
 * - Integrates real-time Socket.io updates for active orders.
 * - Joins private order rooms (`order:${orderId}`).
 * - Receives live GPS telemetry without page refresh.
 * - Seamlessly falls back to props in demo/simulator mode.
 */

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore City Center
const DEFAULT_ZOOM = 13;

export default function DeliveryMap({
  orderId = null,
  center,
  zoom = DEFAULT_ZOOM,
  scrollWheelZoom = true,
  title = "Live Delivery Map",
  customerLocation = null,
  driverLocation = null,
  showRoute = true,
  onRouteCalculated = null,
}) {
  const [internalRouteInfo, setInternalRouteInfo] = useState(null);
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // 1. Socket.io Real-Time Listener (Phase 7)
  useEffect(() => {
    if (!orderId) return;

    joinOrderTrackingRoom(orderId);

    const unsubDriver = onDriverLocationUpdate((data) => {
      if (String(data.orderId) === String(orderId) && data.deliveryLocation) {
        setLiveDriverLocation({
          lat: data.deliveryLocation.lat,
          lng: data.deliveryLocation.lng,
        });
        setLastUpdateTime(new Date(data.deliveryLocation.updatedAt || Date.now()));
      }
    });

    const unsubStatus = onOrderStatusUpdate((data) => {
      if (String(data.orderId) === String(orderId)) {
        setLiveStatus(data.status);
      }
    });

    return () => {
      leaveOrderTrackingRoom(orderId);
      unsubDriver();
      unsubStatus();
    };
  }, [orderId]);

  // Priority: Explicit prop (e.g. real device GPS from tracker) > Live Socket Driver Location
  const effectiveDriverLocation = driverLocation || liveDriverLocation;

  const effectiveCenter =
    normalizeCoords(center) ||
    normalizeCoords(customerLocation) ||
    normalizeCoords(effectiveDriverLocation) ||
    DEFAULT_CENTER;

  const handleRouteUpdate = (result) => {
    if (result.status === 'success') {
      setInternalRouteInfo(result);
    } else if (result.status === 'error') {
      setInternalRouteInfo(null);
    }
    if (onRouteCalculated) {
      onRouteCalculated(result);
    }
  };

  const isLiveGps = !!liveDriverLocation;

  return (
    <div className="delivery-map-card">
      <div className="delivery-map-header">
        <div className="delivery-map-title-group">
          <span className="delivery-map-pulse-dot" aria-hidden="true"></span>
          <h3 className="delivery-map-title">{title}</h3>
          {liveStatus && (
            <span className="delivery-map-status-badge">{liveStatus}</span>
          )}
        </div>

        <div className="delivery-map-header-badges">
          {/* Real-time ETA badge in map header */}
          {internalRouteInfo?.durationSeconds && (
            <span className="delivery-map-eta-pill">
              ⏱️ {formatDuration(internalRouteInfo.durationSeconds)} ({formatDistance(internalRouteInfo.distanceMeters)})
            </span>
          )}
          <span className={`delivery-map-status-pill ${isLiveGps ? 'live-gps-pill' : ''}`}>
            {isLiveGps ? '🟢 Live Real-Time GPS' : 'Phase 7: Real-Time Ready'}
          </span>
        </div>
      </div>

      <div className="delivery-map-viewport">
        <MapContainer
          center={effectiveCenter}
          zoom={zoom}
          scrollWheelZoom={scrollWheelZoom}
          className="leaflet-map-element"
        >
          {/* Base OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Road Routing Polyline & Auto-Fit Bounds */}
          {showRoute && (
            <DeliveryRoute
              customerLocation={customerLocation}
              driverLocation={effectiveDriverLocation}
              onRouteCalculated={handleRouteUpdate}
            />
          )}

          {/* Separate Markers Layer for Customer and Delivery Partner */}
          <DeliveryMarkers
            customerLocation={customerLocation}
            driverLocation={effectiveDriverLocation}
          />
        </MapContainer>
      </div>

      <div className="delivery-map-footer">
        <div className="delivery-map-marker-legend">
          <span className="legend-item">
            <span className="legend-dot green-dot"></span> Customer (Destination)
          </span>
          <span className="legend-item">
            <span className="legend-dot orange-dot"></span> Delivery Partner (Driver)
          </span>
          <span className="legend-item">
            <span className="legend-line route-line-sample"></span> Road Route (OSRM)
          </span>
        </div>
        <div className="delivery-map-footer-meta">
          {lastUpdateTime && (
            <span className="last-ping-label">
              Last Ping: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
          <span className="delivery-map-coord-display">
            Center: <strong>{effectiveCenter[0].toFixed(4)}°, {effectiveCenter[1].toFixed(4)}°</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
