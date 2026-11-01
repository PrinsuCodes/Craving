import React, { useState, useEffect } from 'react';
import './Header.css';
import { assets } from '../../assets/assets';

const Header = () => {
  const img1 = assets.header1_img;
  const img2 = assets.header2_img;
  const img3 = assets.header3_img;
  const img4 = assets.header4_img;

  const images = [img1, img2, img3, img4];
  const extendedImages = [...images, images[0]];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Auto-advance slides every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [images.length]);

  // Seamless infinite loop wrap
  useEffect(() => {
    if (currentIndex === images.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, images.length]);

  const handleIndicatorClick = (idx) => {
    setIsTransitioning(true);
    setCurrentIndex(idx);
  };

  const activeIndex = currentIndex % images.length;

  return (
    <div className='header'>
      {/* Background Slider */}
      <div 
        className="header-slider" 
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`, 
          transition: isTransitioning ? 'transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)' : 'none' 
        }}
      >
        {extendedImages.map((img, index) => (
          <div key={index} className="slider-image" style={{ backgroundImage: `url(${img})` }}></div>
        ))}
      </div>

      {/* Decorative Gradient Overlays */}
      <div className="header-overlay"></div>
      <div className="header-glow"></div>

      {/* Floating Glassmorphic Badge (Top-Right on Desktop) */}
      <div className="header-floating-card">
        <div className="floating-card-icon">🔥</div>
        <div className="floating-card-info">
          <div className="floating-card-top">
            <span className="floating-badge-tag">Top Rated</span>
            <span className="floating-star">★ 4.9</span>
          </div>
          <p className="floating-sub">Fresh Gourmet Cravings</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="header-contents">
        <div className="header-pill">
          <span className="header-pill-pulse"></span>
          <span className="header-pill-text">✨ Fresh & Hot Delivered Fast</span>
        </div>

        <h2>
          Satisfy your <span className="header-gradient-text">cravings</span>, order here
        </h2>
        
        <p>
          Choose from a wide variety of delicious meals made with fresh ingredients. 
          We are here to satisfy your cravings, one great meal at a time.
        </p>

        <div className="header-cta-group">
          <a href="#explore-menu" className="header-cta-btn">
            <span>View Menu</span>
            <svg className="header-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>

          <div className="header-stat-pill">
            <span className="stat-emoji">⚡</span>
            <div className="stat-info">
              <strong>30 Min</strong>
              <small>Delivery</small>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Slider Navigation Controls */}
      <div className="header-controls">
        <div className="header-indicators">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`indicator-dot ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => handleIndicatorClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span className="indicator-progress"></span>
            </button>
          ))}
        </div>
        <div className="header-counter">
          <span className="counter-current">0{activeIndex + 1}</span>
          <span className="counter-divider">/</span>
          <span className="counter-total">0{images.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
