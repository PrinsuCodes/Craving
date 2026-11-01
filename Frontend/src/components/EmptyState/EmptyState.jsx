import React from 'react'
import './EmptyState.css'

const EmptyState = ({ onClear }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-wrapper">
        <span className="empty-state-icon">🍽️</span> {/* Replace with an SVG if you have one */}
      </div>
      <h3 className="empty-state-title">
        No cravings found
      </h3>
      <p className="empty-state-description">
        We couldn't find any dishes matching your current search and filters. Try adjusting them or start fresh.
      </p>
      <button onClick={onClear} className="empty-state-btn">
        Clear All Filters
      </button>
    </div>
  );
}

export default EmptyState
