import React, { useEffect, useState, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchRoadRoute } from '../../services/routingService.js';
import { normalizeCoords } from './coordUtils.js';
import './DeliveryRoute.css';

/**
 * DeliveryRoute Component (Phase 3)
 *
 * Responsibilities:
 * 1. Fetches real drivable road paths from OSRM between driver & customer locations.
 * 2. Swaps GeoJSON [lng, lat] coordinates to Leaflet [lat, lng].
 * 3. Renders a smooth, high-contrast polyline on the map.
 * 4. Automatically fits the map bounds (`map.fitBounds`) so both markers and the full route are in view.
 * 5. Handles network errors, unavailable routes, and aborts in-flight requests.
 */
export default function DeliveryRoute({
  driverLocation,
  customerLocation,
  onRouteCalculated,
  autoFit = true,
}) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeStatus, setRouteStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  // Stable ref for the callback to prevent effect re-triggers
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
  }, [onRouteCalculated]);

  // Keep a reference to the active AbortController to cancel previous fetches
  const abortControllerRef = useRef(null);

  const driverPos = normalizeCoords(driverLocation);
  const customerPos = normalizeCoords(customerLocation);

  const driverLat = driverPos ? driverPos[0] : null;
  const driverLng = driverPos ? driverPos[1] : null;
  const customerLat = customerPos ? customerPos[0] : null;
  const customerLng = customerPos ? customerPos[1] : null;

  useEffect(() => {
    if (driverLat === null || driverLng === null || customerLat === null || customerLng === null) {
      return;
    }

    const currentDriver = [driverLat, driverLng];
    const currentCustomer = [customerLat, customerLng];

    // Cancel any previous in-flight routing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Use a micro-delay (200ms) to debounce rapid state changes (e.g. repeated button clicks)
    const timeoutId = setTimeout(async () => {
      setRouteStatus('loading');
      if (onRouteCalculatedRef.current) {
        onRouteCalculatedRef.current({ status: 'loading' });
      }

      try {
        const result = await fetchRoadRoute(currentDriver, currentCustomer, {
          signal: controller.signal,
        });

        setRouteCoords(result.coordinates);
        setRouteStatus('success');

        // Adjust map bounds to show both points and the entire route
        if (autoFit && map && result.coordinates.length > 0) {
          const bounds = L.latLngBounds(result.coordinates);
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 16,
            animate: true,
          });
        }

        if (onRouteCalculatedRef.current) {
          onRouteCalculatedRef.current({
            status: 'success',
            coordinates: result.coordinates,
            distanceMeters: result.distanceMeters,
            durationSeconds: result.durationSeconds,
            summary: result.summary,
            error: null,
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        console.error('OSRM Route Calculation Error:', err);
        setRouteStatus('error');

        // Fallback: direct straight line between points
        setRouteCoords([currentDriver, currentCustomer]);

        if (onRouteCalculatedRef.current) {
          onRouteCalculatedRef.current({
            status: 'error',
            coordinates: [currentDriver, currentCustomer],
            distanceMeters: null,
            durationSeconds: null,
            summary: null,
            error: err.message,
          });
        }
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [driverLat, driverLng, customerLat, customerLng, map, autoFit]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      {/* 1. Outer contrast casing (White border under the main line) */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: '#ffffff',
          weight: 8,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* 2. Main delivery route polyline */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: routeStatus === 'error' ? '#ef4444' : '#ff5722',
          weight: 5,
          opacity: 0.95,
          dashArray: routeStatus === 'error' ? '6, 8' : undefined, // Dashed if fallback straight line
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}