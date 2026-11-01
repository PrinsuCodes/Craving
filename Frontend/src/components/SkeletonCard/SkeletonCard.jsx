import React from 'react'
import './SkeletonCard.css'

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-category"></div>
      <div className="skeleton-price"></div>
    </div>
  );
}

export default SkeletonCard
