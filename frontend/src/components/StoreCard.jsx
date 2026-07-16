import React, { useRef, useEffect } from 'react';

export default function StoreCard({ store, isActive, onClick }) {
  const cardRef = useRef(null);

  // Auto-scroll card into view in the sidebar when selected
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  const { name, address, city, phone, distance, latitude, longitude } = store;

  // Format distance
  const distanceStr = distance !== null && distance !== undefined 
    ? `${distance} km away` 
    : null;

  // Google Maps directions / search link
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div 
      ref={cardRef}
      className={`store-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="store-card-header">
        <h3 className="store-title">{name}</h3>
        {distanceStr && <span className="store-distance-badge">{distanceStr}</span>}
      </div>
      
      <div className="store-card-body">
        <p className="store-detail-row">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="detail-text">{address}, {city}</span>
        </p>

        {phone && (
          <p className="store-detail-row">
            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="detail-text">{phone}</span>
          </p>
        )}

        <p className="store-detail-row coords-row">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <span className="detail-text lat-lng-text">
            Lat: {Number(latitude).toFixed(5)}, Lng: {Number(longitude).toFixed(5)}
          </span>
        </p>
      </div>

      <div className="store-card-footer">
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="google-maps-btn"
          onClick={(e) => e.stopPropagation()} // Avoid triggering active state when link clicked
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
