import React from 'react';
import './TrustBar.css';

const TrustBar = () => {
    const trustItems = [
        {
            icon: "⚡",
            title: "Fast Delivery",
            subtitle: "30-min guaranteed"
        },
        {
            icon: "🥗",
            title: "Fresh & Quality",
            subtitle: "Cooked with love"
        },
        {
            icon: "📍",
            title: "Live GPS Tracking",
            subtitle: "Follow your order"
        },
        {
            icon: "💳",
            title: "Easy Payment",
            subtitle: "100% secure checkout"
        }
    ];

    return (
        <div className="trust-bar">
            <div className="trust-bar-container">
                {trustItems.map((item, index) => (
                    <div key={index} className="trust-item">
                        <div className="trust-icon-wrapper">
                            <span className="trust-icon">{item.icon}</span>
                        </div>
                        <div className="trust-text">
                            <span className="trust-title">{item.title}</span>
                            <span className="trust-subtitle">{item.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustBar;