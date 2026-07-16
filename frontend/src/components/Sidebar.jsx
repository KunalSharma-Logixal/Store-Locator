import React, { useRef, useState } from 'react';
import StoreCard from './StoreCard';

export default function Sidebar({
  stores,
  searchVal,
  setSearchVal,
  radiusVal,
  setRadiusVal,
  userLocation,
  onLocate,
  isLocating,
  isFetchingStores,
  activeStoreId,
  setActiveStoreId,
  onUploadStart,
  onUploadComplete,
  tenants = [],
  selectedTenant = 'VPRO',
  setSelectedTenant,
  onAddressSearch
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Address/ Landmark Geocode handler
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!addressQuery.trim()) return;

    setIsGeocoding(true);
    try {
      await onAddressSearch(addressQuery);
    } catch (err) {
      console.error('Address search error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle locating button text
  const locateBtnText = isLocating
    ? 'Fetching current location...'
    : userLocation
      ? `Location: Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`
      : 'Use My Current Location';

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  // API Call for Upload
  const uploadFile = async (file) => {
    const allowedExtensions = ['.csv', '.xlsx'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    // Client-side quick checks
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadError('Unsupported file type. Please use .csv or .xlsx');
      return;
    }
    // Commented out max file size validation for now
    // if (file.size > maxFileSize) {
    //   setUploadError('File exceeds size limit of 10MB.');
    //   return;
    // }

    setUploadError('');
    setIsUploading(true);
    onUploadStart();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      onUploadComplete(data);
    } catch (err) {
      onUploadComplete({
        success: false,
        message: 'A network error occurred while uploading. Ensure the backend is running.',
        summary: {
          total_records: 0,
          imported_records: 0,
          failed_records: 0,
          duplicate_records: 0,
          errors: [{ row: 0, error: err.message }]
        }
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <svg className="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
        <h1>Store Locator</h1>
      </div>

      {/* Geolocation Button */}
      <div className="location-action-panel">
        <button 
          onClick={onLocate} 
          disabled={isLocating}
          className={`locate-btn ${userLocation ? 'located' : ''} ${isLocating ? 'loading' : ''}`}
        >
          {isLocating ? (
            <span className="spinner-icon"></span>
          ) : (
            <svg className="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
          {locateBtnText}
        </button>
      </div>

      {/* Address Geocode Search Box */}
      <div className="address-search-panel" style={{ padding: '0 24px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <form onSubmit={handleAddressSearch} style={{ display: 'flex', gap: '8px', width: '100%', margin: 0, padding: 0 }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', width: '16px', height: '16px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search your City..."
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 36px', borderRadius: 'var(--card-radius)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-family)', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', transition: 'var(--transition-smooth)' }}
              disabled={isGeocoding}
            />
            {addressQuery && (
              <button type="button" onClick={() => setAddressQuery('')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>&times;</button>
            )}
          </div>
          <button 
            type="submit" 
            className="locate-btn"
            style={{ width: 'auto', padding: '0 16px', fontSize: '13px', borderRadius: 'var(--card-radius)', height: '38px', margin: 0, whiteSpace: 'nowrap' }}
            disabled={isGeocoding}
          >
            {isGeocoding ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Filters Form */}
      <div className="filters-section">
        {tenants.length > 0 && (
          <div className="radius-selector-box" style={{ marginBottom: '14px' }}>
            <label htmlFor="tenant-select" style={{ fontWeight: '600' }}>Active Tenant Storefront:</label>
            <select
              id="tenant-select"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              {tenants.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
        {/* <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by store name or city..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          {searchVal && (
            <button className="clear-search-btn" onClick={() => setSearchVal('')}>&times;</button>
          )}
        </div> */}

        <div className="radius-selector-box">
          <label htmlFor="radius-select">Radius Range:</label>
          <select
            id="radius-select"
            value={radiusVal || ''}
            onChange={(e) => setRadiusVal(e.target.value ? Number(e.target.value) : null)}
            disabled={!userLocation}
            title={!userLocation ? "Enable your location to use the radius filter" : ""}
          >
            <option value="">Show All Stores</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="20">20 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
          {!userLocation && (
            <p className="radius-helper-text">* Enable location coordinates to filter by radius.</p>
          )}
        </div>
      </div>

      {/* Stores List Container */}
      <div className="stores-list-section">
        {isFetchingStores ? (
          <div className="loading-state">
            <span className="spinner-big"></span>
            <p>Finding nearby stores...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            <p>No stores found.</p>
            <span>Try adjusting your filters or search terms.</span>
          </div>
        ) : (
          <div className="stores-scroll-container">
            <p className="results-count">Showing {stores.length} store{stores.length !== 1 ? 's' : ''}</p>
            {stores.map((store) => (
              <StoreCard
                key={store.store_id}
                store={store}
                isActive={store.store_id === activeStoreId}
                onClick={() => setActiveStoreId(store.store_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload File Panel */}
      <div className="upload-footer-section">
        <h3>Upload Stores</h3>
        <div 
          className={`dropzone ${isDragging ? 'dragover' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv, .xlsx"
            style={{ display: 'none' }}
          />
          {isUploading ? (
            <div className="uploading-state">
              <span className="spinner-icon"></span>
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="compact-dropzone-content">
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="dropzone-text">Click or drag CSV/Excel here</span>
            </div>
          )}
        </div>
        {uploadError && <p className="upload-error-msg">{uploadError}</p>}
      </div>
    </aside>
  );
}
