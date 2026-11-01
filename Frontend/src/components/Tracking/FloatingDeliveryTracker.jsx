import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import DeliveryMap from './DeliveryMap.jsx';
import { formatDistance, formatDuration } from './etaUtils.js';
import {
  joinOrderTrackingRoom,
  leaveOrderTrackingRoom,
  onDriverLocationUpdate,
  onOrderStatusUpdate,
  emitDriverLocationPing,
  getSocket,
} from '../../services/socketService.js';
import {
  watchDeviceLocation,
  isGeolocationSupported,
} from '../../services/geolocationService.js';
import './FloatingDeliveryTracker.css';

/**
 * FloatingDeliveryTracker Component
 *
 * Implements a floating, fixed-position live map popup in the top-right corner.
 * - Uses the user's real device GPS (via HTML5 navigator.geolocation) as the delivery partner GPS.
 * - Streams live coordinates to the backend via WebSockets so database & clients stay synced.
 * - Displays delivery partner marker, customer destination, and OSRM road route.
 * - Dynamically updates ETA, distance, and last updated timestamp.
 * - Automatically dismisses and notifies parent when status changes to "Delivered".
 */
export default function FloatingDeliveryTracker({
  orderId,
  order = null,
  onClose,
  backendUrl = 'http://localhost:4000',
  token = '',
}) {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [orderStatus, setOrderStatus] = useState(order?.status || 'Out for delivery');
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [errorMsg, setErrorMsg] = useState(null);

  // Real device GPS states
  const [isUsingDeviceGps, setIsUsingDeviceGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState(() =>
    isGeolocationSupported() ? null : 'Geolocation is not supported by your browser.'
  );

  const pollIntervalRef = useRef(null);

  // Set up Device GPS Streaming, WebSockets & Polling Fallback
  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;

    // 1. Initial backend tracking details fetch
    const fetchTrackingInfo = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${backendUrl}/api/order/track/${orderId}`, { headers });

        if (isMounted && response.data.success && response.data.data) {
          const data = response.data.data;
          setTrackingData(data);
          setOrderStatus(data.status);

          // If device GPS hasn't taken over yet, use stored delivery location
          if (!isUsingDeviceGps && data.deliveryLocation && data.deliveryLocation.lat) {
            setDriverLocation({
              lat: data.deliveryLocation.lat,
              lng: data.deliveryLocation.lng,
            });
            setLastUpdated(new Date(data.deliveryLocation.updatedAt || Date.now()));
          }

          // If backend reports order is already delivered, close immediately
          if (data.status && data.status.toLowerCase() === 'delivered') {
            if (onClose) onClose({ delivered: true, orderId });
          }
        }
      } catch (err) {
        console.warn('[FloatingTracker] Failed to fetch initial tracking details:', err.message);
        if (isMounted) {
          if (order) {
            setTrackingData({
              orderId: order._id || orderId,
              status: order.status,
              customerCoords: order.customerCoords || { lat: 12.9352, lng: 77.6245 },
              deliveryLocation: order.deliveryLocation || null,
              address: order.address,
            });
            if (!isUsingDeviceGps && order.deliveryLocation?.lat) {
              setDriverLocation(order.deliveryLocation);
              setLastUpdated(new Date(order.deliveryLocation.updatedAt || Date.now()));
            }
          } else {
            setErrorMsg('Unable to connect to tracking server. Retrying...');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTrackingInfo();

    // 2. Stream real device GPS as the delivery partner GPS
    let unsubGps = () => {};
    if (isGeolocationSupported()) {
      unsubGps = watchDeviceLocation(
        (pos) => {
          if (!isMounted) return;
          console.log('[FloatingTracker] Using device GPS for Delivery Partner:', pos);
          const coords = { lat: pos.lat, lng: pos.lng };
          setDriverLocation(coords);
          setIsUsingDeviceGps(true);
          setGpsAccuracy(pos.accuracyMeters);
          setGpsError(null);
          setLastUpdated(new Date(pos.timestamp || Date.now()));
          setConnectionStatus('connected');
          setLoading(false);

          // Transmit real-time GPS coordinates to backend & WebSocket room
          emitDriverLocationPing(orderId, pos.lat, pos.lng);
        },
        (err) => {
          if (!isMounted) return;
          console.warn('[FloatingTracker] Geolocation warning:', err.message);
          setGpsError(err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
      );
    }

    // 3. Join private socket room
    joinOrderTrackingRoom(orderId);

    // 4. Socket event: live driver location updates
    const unsubDriver = onDriverLocationUpdate((payload) => {
      if (String(payload.orderId) === String(orderId)) {
        if (payload.customerCoords) {
          setTrackingData((prev) =>
            prev ? { ...prev, customerCoords: payload.customerCoords } : prev
          );
        }
        // Only override from socket if this client is not directly streaming its device GPS
        if (!isUsingDeviceGps && payload.deliveryLocation) {
          setDriverLocation({
            lat: payload.deliveryLocation.lat,
            lng: payload.deliveryLocation.lng,
          });
          setLastUpdated(new Date(payload.deliveryLocation.updatedAt || Date.now()));
          setConnectionStatus('connected');
        }
      }
    });

    // 5. Socket event: order status transition (e.g. Admin marks "Delivered")
    const unsubStatus = onOrderStatusUpdate((payload) => {
      if (String(payload.orderId) === String(orderId)) {
        setOrderStatus(payload.status);
        if (payload.status && payload.status.toLowerCase() === 'delivered') {
          if (onClose) onClose({ delivered: true, orderId });
        }
      }
    });

    // 6. Monitor socket connectivity
    const socket = getSocket();
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('reconnecting');
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // 7. Polling fallback every 12 seconds in case WebSockets are interrupted
    pollIntervalRef.current = setInterval(() => {
      fetchTrackingInfo();
    }, 12000);

    // Cleanup subscriptions on unmount or when closed
    return () => {
      isMounted = false;
      unsubGps();
      leaveOrderTrackingRoom(orderId);
      unsubDriver();
      unsubStatus();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [orderId, backendUrl, token, order, onClose, isUsingDeviceGps]);

  const handleRouteCalculated = (result) => {
    if (result.status === 'success') {
      setRouteMetrics({
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        summary: result.summary,
      });
    }
  };

  // Derive realistic customer destination in the user's local city/area
  const effectiveCustomerCoords = useMemo(() => {
    const rawCustomerCoords = trackingData?.customerCoords || order?.customerCoords;
    if (!driverLocation?.lat || !driverLocation?.lng) {
      return rawCustomerCoords || { lat: 12.9352, lng: 77.6245 };
    }

    // If order customerCoords are in the same general area (< 25km), preserve them
    if (rawCustomerCoords?.lat && rawCustomerCoords?.lng) {
      const latDiff = Math.abs(rawCustomerCoords.lat - driverLocation.lat);
      const lngDiff = Math.abs(rawCustomerCoords.lng - driverLocation.lng);
      if (latDiff < 0.25 && lngDiff < 0.25) {
        return rawCustomerCoords;
      }
    }

    // Otherwise, place customer destination ~1km away from driver GPS so local street routing works
    return {
      lat: Number((driverLocation.lat + 0.0075).toFixed(6)),
      lng: Number((driverLocation.lng + 0.0075).toFixed(6)),
    };
  }, [driverLocation, trackingData?.customerCoords, order?.customerCoords]);

  const effectiveDriverCoords = driverLocation || trackingData?.deliveryLocation;

  return (
    <div
      className="floating-tracker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Live Delivery Tracking Popup"
    >
      <div className="floating-tracker-card">
        {/* Header */}
        <div className="tracker-card-header">
          <div className="tracker-header-left">
            <span className="live-pulse-dot" aria-hidden="true"></span>
            <div>
              <h4 className="tracker-title">Live Delivery Tracking</h4>
              <span className="tracker-order-id">Order: #{String(orderId).slice(-6)}</span>
            </div>
          </div>
          <button
            className="tracker-close-btn"
            onClick={() => onClose && onClose({ dismissed: true })}
            aria-label="Close tracking popup"
          >
            &times;
          </button>
        </div>

        {/* Real Device GPS Status Banner */}
        <div className="tracker-gps-banner">
          {isUsingDeviceGps ? (
            <span className="gps-indicator gps-active">
              <span className="gps-dot"></span>
              Using your device GPS as delivery partner {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
            </span>
          ) : gpsError ? (
            <span className="gps-indicator gps-fallback">
              📍 Location blocked ({gpsError}). Using default location.
            </span>
          ) : (
            <span className="gps-indicator gps-acquiring">
              🛰️ Acquiring your device GPS for delivery partner...
            </span>
          )}
        </div>

        {/* Telemetry / ETA Bar */}
        <div className="tracker-metrics-bar">
          <div className="metric-cell">
            <span className="metric-tag">Status</span>
            <span className="metric-pill status-pill-active">
              🛵 {orderStatus}
            </span>
          </div>

          <div className="metric-cell">
            <span className="metric-tag">ETA</span>
            <span className="metric-strong">
              {routeMetrics?.durationSeconds ? formatDuration(routeMetrics.durationSeconds) : '--'}
            </span>
          </div>

          <div className="metric-cell">
            <span className="metric-tag">Distance</span>
            <span className="metric-strong">
              {routeMetrics?.distanceMeters ? formatDistance(routeMetrics.distanceMeters) : '--'}
            </span>
          </div>
        </div>

        {/* Interactive Map Viewport */}
        <div className="tracker-map-viewport">
          {loading && !effectiveDriverCoords ? (
            <div className="tracker-loading-state">
              <div className="tracker-spinner"></div>
              <p>Connecting to your device GPS...</p>
            </div>
          ) : errorMsg && !effectiveDriverCoords ? (
            <div className="tracker-error-state">
              <p>⚠️ {errorMsg}</p>
              <button
                className="tracker-retry-btn"
                onClick={() => {
                  setLoading(true);
                  setErrorMsg(null);
                }}
              >
                Retry Connection
              </button>
            </div>
          ) : !effectiveDriverCoords ? (
            <div className="tracker-waiting-state">
              <span className="waiting-icon">🛵</span>
              <h4>Acquiring Location</h4>
              <p>Waiting for GPS satellite fix or network triangulation...</p>
            </div>
          ) : (
            <DeliveryMap
              orderId={orderId}
              customerLocation={effectiveCustomerCoords}
              driverLocation={effectiveDriverCoords}
              showRoute={true}
              scrollWheelZoom={true}
              zoom={14}
              onRouteCalculated={handleRouteCalculated}
              title={`Live Order #${String(orderId).slice(-6)}`}
            />
          )}
        </div>

        {/* Footer Meta Details */}
        <div className="tracker-footer-bar">
          <div className="tracker-footer-left">
            <span className={`connection-pill ${connectionStatus}`}>
              <span className="conn-dot"></span>
              {connectionStatus === 'connected' ? 'Live GPS Stream' : 'Reconnecting...'}
            </span>
            {lastUpdated && (
              <span className="last-ping-text">
                Last ping: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          {trackingData?.address?.street && (
            <div
              className="delivery-destination-text"
              title={`${trackingData.address.street}, ${trackingData.address.city || ''}`}
            >
              📍 {trackingData.address.street}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}