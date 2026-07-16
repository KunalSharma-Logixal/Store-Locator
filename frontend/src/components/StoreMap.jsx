import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from '../leaflet-setup';

// Import MarkerCluster CSS via import statements since it is in our package.json
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// 1. Premium Custom SVG Marker Pin Icon
const createStoreIcon = (isActive = false) => {
  const color = isActive ? '#ff385c' : '#4f46e5'; // Premium rose vs indigo
  const size = isActive ? 44 : 36;
  const pinClass = isActive ? 'marker-pin active-pin' : 'marker-pin';
  
  return L.divIcon({
    className: `custom-store-pin-wrapper`,
    html: `
      <div class="${pinClass}" style="background-color: ${color}">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Pulsing indicator for User's Current Location
const userLocationIcon = L.divIcon({
  className: 'custom-user-pin-wrapper',
  html: `
    <div class="user-pulse-container">
      <div class="user-pulse-core"></div>
      <div class="user-pulse-glow"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// 2. Custom Map Controller handling Leaflet native layers and clustering
function MapController({ stores, activeStoreId, setActiveStoreId, userLocation }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);
  const markerRefs = useRef({});

  // Effect to manage Marker Clustering, Popup Binds, and Card Selection Sync
  useEffect(() => {
    if (!map) return;

    // Create marker cluster group
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true
    });

    clusterGroupRef.current = clusterGroup;
    markerRefs.current = {};

    // Generate markers
    stores.forEach((store) => {
      const { store_id, name, latitude, longitude, address, city, phone, distance } = store;
      const isActive = store_id === activeStoreId;

      const marker = L.marker([latitude, longitude], {
        icon: createStoreIcon(isActive)
      });

      // Bind detailed Store Popup
      const distanceText = distance !== null && distance !== undefined 
        ? `<div class="popup-distance">${distance} km away</div>` 
        : '';
      
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      const popupContent = `
        <div class="map-popup-card">
          <h4>${name}</h4>
          <p class="popup-address">${address}, ${city}</p>
          ${phone ? `<p class="popup-phone">📞 ${phone}</p>` : ''}
          ${distanceText}
          <div class="popup-coords">Lat: ${Number(latitude).toFixed(5)}, Lng: ${Number(longitude).toFixed(5)}</div>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-gmaps-btn">
            Open in Google Maps
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'premium-leaflet-popup'
      });

      // Select store card in sidebar when marker is clicked
      marker.on('click', () => {
        setActiveStoreId(store_id);
      });

      // Track reference to open popup programmatically
      markerRefs.current[store_id] = marker;
      clusterGroup.addLayer(marker);
    });

    // Add clusters to map
    map.addLayer(clusterGroup);

    // Auto-fit bounds if we have stores and NO store is actively clicked (on load/filter changes)
    if (stores.length > 0 && !activeStoreId) {
      const bounds = L.latLngBounds(stores.map(s => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, stores, setActiveStoreId]);

  // Effect to react to Active Store ID changing (Highlight, pan map, open popup)
  useEffect(() => {
    if (!map || !activeStoreId || stores.length === 0) return;

    const activeStore = stores.find(s => s.store_id === activeStoreId);
    if (!activeStore) return;

    // Pan & zoom to active marker
    map.setView([activeStore.latitude, activeStore.longitude], 15, {
      animate: true,
      duration: 1.0
    });

    // Update marker icons to highlight active state
    stores.forEach((store) => {
      const m = markerRefs.current[store.store_id];
      if (m) {
        m.setIcon(createStoreIcon(store.store_id === activeStoreId));
      }
    });

    // Open popup for active marker (If clustered, Leaflet markercluster has a method to zoom/spiderfy and show)
    const activeMarker = markerRefs.current[activeStoreId];
    if (activeMarker) {
      const parentCluster = clusterGroupRef.current.getVisibleParent(activeMarker);
      
      // If the marker is currently clustered, zoom to it first
      if (parentCluster && typeof parentCluster.spiderfy === 'function') {
        clusterGroupRef.current.zoomToShowLayer(activeMarker, () => {
          activeMarker.openPopup();
        });
      } else {
        // Not clustered or already visible
        activeMarker.openPopup();
      }
    }
  }, [activeStoreId, map, stores]);

  // Effect to pan to user location on trigger
  useEffect(() => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13, {
        animate: true,
        duration: 1.0
      });
    }
  }, [map, userLocation]);

  return null;
}

export default function StoreMap({ stores, activeStoreId, setActiveStoreId, userLocation, locationLabel = 'Your Location' }) {
  // Default map center set to India
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        zoomControl={false} // Disable default zoom control to add premium bottom-right one
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Custom Zoom Control placed in bottom right */}
        <ZoomControl position="bottomright" />

        {/* User Current Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup className="premium-leaflet-popup">
              <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{locationLabel}</div>
            </Popup>
          </Marker>
        )}

        {/* Map state synchronize controller */}
        <MapController 
          stores={stores} 
          activeStoreId={activeStoreId} 
          setActiveStoreId={setActiveStoreId}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
}
