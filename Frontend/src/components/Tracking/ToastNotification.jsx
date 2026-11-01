import React, { useEffect } from 'react';
import './ToastNotification.css';

/**
 * ToastNotification Component
 *
 * Renders fixed floating toast notifications in the top-right corner of the screen.
 * Features:
 * - Positioned fixed at top: 20px, right: 20px (desktop) with high z-index (100000).
 * - Green success checkmark icon, rounded corners, subtle shadow, smooth slide-in animation from right.
 * - Auto-dismiss after 3–5 seconds (default 4000ms).
 * - Accessible manual dismiss (close button).
 * - Mobile responsive padding and position.
 */
export default function ToastNotification({
  message,
  type = 'success', // 'success' | 'info' | 'warning' | 'error'
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`craving-toast-container toast-${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="craving-toast-content">
        <span className="craving-toast-icon">
          {type === 'success' && (
            <svg
              className="craving-toast-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#22c55e" />
              <path
                d="M8 12.2l2.6 2.6L16 9.4"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg
              className="craving-toast-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#0284c7" />
              <path
                d="M12 8.5v.01M12 11.5v4"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {type === 'warning' && (
            <svg
              className="craving-toast-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#f59e0b" />
              <path
                d="M12 8v4.5M12 15.5v.01"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {type === 'error' && (
            <svg
              className="craving-toast-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#ef4444" />
              <path
                d="M15 9l-6 6M9 9l6 6"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="craving-toast-message">{message}</span>
      </div>
      <button
        type="button"
        className="craving-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
