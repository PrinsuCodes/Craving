import React, { useState, useEffect, useRef } from 'react';
import './DeliverySimulator.css';

/**
 * DeliverySimulator Component (Phase 5)
 *
 * Purpose:
 * Allows developers and learners to test live tracking without physical delivery partners.
 * Animate a test driver marker step-by-step along the calculated OSRM road waypoints.
 *
 * Key Features:
 * - Play, Pause, Resume, and Reset controls.
 * - Multi-speed playback (1x, 2x, 4x).
 * - Progress bar (% completed towards destination).
 * - Safe timer cleanup on unmount to avoid memory leaks.
 * - Prominent "DEMO MODE" watermark.
 * - Guarded for development environments (import.meta.env.DEV).
 */
export default function DeliverySimulator({
  routeCoordinates = [],
  onPositionChange,
  onSimulationStatusChange,
  disabled = false,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(2); // Default 2x speed for testing
  const [isCompleted, setIsCompleted] = useState(false);

  // Keep interval ref for cleanup
  const timerRef = useRef(null);

  // Stable ref for the callback
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const totalWaypoints = routeCoordinates.length;

  // React pattern: Reset simulation state when routeCoordinates array reference changes
  const [prevRouteCoords, setPrevRouteCoords] = useState(routeCoordinates);
  if (routeCoordinates !== prevRouteCoords) {
    setPrevRouteCoords(routeCoordinates);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsCompleted(false);
  }

  // Main simulation timer loop
  useEffect(() => {
    if (!isPlaying || totalWaypoints === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Step interval: at 1x speed, 800ms per waypoint; at 2x, 400ms; at 4x, 200ms
    const stepDuration = Math.max(100, Math.round(800 / speedMultiplier));

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        if (nextIndex >= totalWaypoints) {
          // Reached destination!
          clearInterval(timerRef.current);
          setIsPlaying(false);
          setIsCompleted(true);
          if (onSimulationStatusChange) {
            onSimulationStatusChange('completed');
          }
          return totalWaypoints - 1;
        }

        const nextCoord = routeCoordinates[nextIndex];
        if (onPositionChangeRef.current && nextCoord) {
          onPositionChangeRef.current(nextCoord, nextIndex, totalWaypoints);
        }

        return nextIndex;
      });
    }, stepDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, totalWaypoints, onSimulationStatusChange, routeCoordinates]);

  const handlePlay = () => {
    if (totalWaypoints === 0) return;
    if (isCompleted) {
      // If completed previously, restart from beginning
      setCurrentIndex(0);
      setIsCompleted(false);
      if (routeCoordinates[0] && onPositionChangeRef.current) {
        onPositionChangeRef.current(routeCoordinates[0], 0, totalWaypoints);
      }
    }
    setIsPlaying(true);
    if (onSimulationStatusChange) onSimulationStatusChange('playing');
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (onSimulationStatusChange) onSimulationStatusChange('paused');
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setIsCompleted(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (routeCoordinates[0] && onPositionChangeRef.current) {
      onPositionChangeRef.current(routeCoordinates[0], 0, totalWaypoints);
    }
    if (onSimulationStatusChange) onSimulationStatusChange('reset');
  };

  const progressPercent = totalWaypoints > 1
    ? Math.min(100, Math.round((currentIndex / (totalWaypoints - 1)) * 100))
    : 0;

  // Development-only guard
  const isDev = import.meta.env.DEV;
  if (!isDev && !disabled) {
    return null; // Do not render in production builds
  }

  return (
    <div className="delivery-simulator-card">
      <div className="simulator-header">
        <div className="simulator-badge-title">
          <span className="demo-badge">DEMO MODE</span>
          <h4>Delivery Route Simulator</h4>
        </div>
        <span className="simulator-disclaimer">
          Simulated Movement &bull; No Real Driver Assigned
        </span>
      </div>

      {/* Progress Bar */}
      <div className="simulator-progress-section">
        <div className="progress-labels">
          <span>Pickup / Start</span>
          <span className="progress-percentage">{progressPercent}% In Transit</span>
          <span>Delivered</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Controls: Play, Pause, Reset, Speed */}
      <div className="simulator-controls-row">
        <div className="simulator-playback-buttons">
          {!isPlaying ? (
            <button
              className="sim-btn sim-btn-play"
              onClick={handlePlay}
              disabled={totalWaypoints === 0}
            >
              {isCompleted ? '↺ Replay' : currentIndex > 0 ? '▶ Resume' : '▶ Start Simulation'}
            </button>
          ) : (
            <button className="sim-btn sim-btn-pause" onClick={handlePause}>
              ⏸ Pause
            </button>
          )}

          <button
            className="sim-btn sim-btn-reset"
            onClick={handleReset}
            disabled={currentIndex === 0 && !isCompleted}
          >
            ⏹ Reset
          </button>
        </div>

        {/* Speed Selector */}
        <div className="simulator-speed-selector">
          <span className="speed-label">Speed:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              className={`speed-btn ${speedMultiplier === spd ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Step details */}
        <div className="simulator-step-info">
          Waypoint <strong>{currentIndex + 1}</strong> of <strong>{totalWaypoints || '--'}</strong>
        </div>
      </div>

      {isCompleted && (
        <div className="simulator-completed-banner">
          🎉 <strong>Simulation Finished:</strong> The test delivery partner has arrived at the customer destination!
        </div>
      )}
    </div>
  );
}