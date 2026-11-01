import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { normalizeCoords } from './coordUtils.js';
import './DeliveryMarkers.css';

// Customer Marker Icon (Green Home/Pin)
const customerIcon = L.divIcon({
  className: 'custom-leaflet-marker customer-marker',
  html: `
    <div class="marker-pin customer-pin">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
    <div class="marker-shadow"></div>
  `,
  iconSize: [36, 42],
  iconAnchor: [18, 42], // Point of the icon which corresponds to marker's location
  popupAnchor: [0, -38],
});

// Delivery Partner Marker Icon (Orange Scooter/Driver Pin)
const driverIcon = L.divIcon({
  className: 'custom-leaflet-marker driver-marker',
  html: `
    <div class="marker-pulse-ring"></div>
    <div class="marker-pin driver-pin">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"></circle>
        <circle cx="18.5" cy="17.5" r="3.5"></circle>
        <path d="M15 6h-5a2 2 0 0 0-2 2v2"></path>
        <path d="M8 12h7l3 5"></path>
        <path d="M2 17.5h3.5"></path>
      </svg>
    </div>
    <div class="marker-shadow"></div>
  `,
  iconSize: [36, 42],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
});

/**
 * DeliveryMarkers Component
 *
 * Keeps marker rendering separate from base map initialization.
 * Renders:
 * 1. Customer Marker with a "Delivery Destination (Test)" badge.
 * 2. Delivery Partner Marker with an "Assigned Partner (Test)" badge.
 */
export default function DeliveryMarkers({ customerLocation, driverLocation }) {
  const customerPos = normalizeCoords(customerLocation);
  const driverPos = normalizeCoords(driverLocation);

  return (
    <>
      {/* 1. Customer Location Marker */}
      {customerPos && (
        <Marker position={customerPos} icon={customerIcon}>
          <Tooltip direction="top" offset={[0, -36]} opacity={0.95} permanent={false}>
            <strong>Customer Location (Test)</strong>
          </Tooltip>
          <Popup className="custom-marker-popup">
            <div className="popup-content customer-popup">
              <span className="popup-badge green-badge">Customer Destination</span>
              <h4>Delivery Address</h4>
              <p className="popup-coords">
                Lat: {customerPos[0].toFixed(5)}, Lng: {customerPos[1].toFixed(5)}
              </p>
              <p className="popup-disclaimer">⚠️ Configurable test location</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 2. Delivery Partner Location Marker */}
      {driverPos && (
        <Marker position={driverPos} icon={driverIcon}>
          <Tooltip direction="top" offset={[0, -36]} opacity={0.95} permanent={false}>
            <strong>Delivery Partner (Test)</strong>
          </Tooltip>
          <Popup className="custom-marker-popup">
            <div className="popup-content driver-popup">
              <span className="popup-badge orange-badge">Delivery Partner</span>
              <h4>Driver Location</h4>
              <p className="popup-coords">
                Lat: {driverPos[0].toFixed(5)}, Lng: {driverPos[1].toFixed(5)}
              </p>
              <p className="popup-disclaimer">⚠️ Simulated test location (No real partner assigned)</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}