import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StoreMap from './components/StoreMap';
import UploadSummaryModal from './components/UploadSummaryModal';

export default function App() {
  // Store Locator States
  const [stores, setStores] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [radiusVal, setRadiusVal] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Your Location');
  
  // UI Status States
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingStores, setIsFetchingStores] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState(null);
  
  // Upload Result States
  const [uploadResult, setUploadResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tenant States
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('VPRO');

  // Fetch available tenants from backend on load (with frontend fallback)
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (!response.ok) {
          throw new Error('API returned non-successful response');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data);
          setSelectedTenant(data[0]);
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (error) {
        console.warn('Failed to fetch tenants from backend, using VPRO and VFASHION fallback:', error);
        const fallback = ["VPRO", "VFASHION"];
        setTenants(fallback);
        setSelectedTenant(fallback[0]);
      }
    };
    fetchTenants();
  }, []);

  // Fetch stores from API based on current filters, location coords, and tenant
  const fetchStores = async () => {
    setIsFetchingStores(true);
    try {
      let queryParams = [];
      
      // Always filter by selected tenant
      queryParams.push(`tenant_id=${encodeURIComponent(selectedTenant)}`);
      
      if (searchVal.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchVal.trim())}`);
      }
      
      if (userLocation) {
        queryParams.push(`lat=${userLocation.lat}`);
        queryParams.push(`lng=${userLocation.lng}`);
        
        if (radiusVal) {
          queryParams.push(`radius=${radiusVal}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await fetch(`/api/stores${queryString}`);
      const data = await response.json();
      
      setStores(data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsFetchingStores(false);
    }
  };

  // Trigger store refetch when search, radius, userLocation, or selectedTenant updates
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStores();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, radiusVal, userLocation, selectedTenant]);

  // Handle Geolocation API to fetch user's latitude and longitude
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLabel('Your Location');
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        let errorMsg = 'Failed to retrieve your location.';
        if (error.code === 1) {
          errorMsg = 'Location access denied. Please enable location permissions in your browser.';
        } else if (error.code === 2) {
          errorMsg = 'Location unavailable. Make sure location services are turned on.';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out.';
        }
        alert(errorMsg);
      },
      options
    );
  };

  // Handle address/landmark geocode and search directly via store API
  const handleAddressSearch = async (addressQuery) => {
    setIsFetchingStores(true);
    try {
      let queryParams = [];
      queryParams.push(`tenant_id=${encodeURIComponent(selectedTenant)}`);
      queryParams.push(`address=${encodeURIComponent(addressQuery.trim())}`);
      if (radiusVal) {
        queryParams.push(`radius=${radiusVal}`);
      }
      if (searchVal.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchVal.trim())}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await fetch(`/api/stores${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search location.');
      }
      
      const data = await response.json();
      setStores(data);

      // Extract resolved coords from custom response headers
      const searchedLat = response.headers.get('X-Searched-Latitude');
      const searchedLng = response.headers.get('X-Searched-Longitude');
      const searchedNameEncoded = response.headers.get('X-Searched-Display-Name');
      const searchedName = searchedNameEncoded ? decodeURIComponent(searchedNameEncoded) : '';

      if (searchedLat && searchedLng) {
        setUserLocation({ lat: parseFloat(searchedLat), lng: parseFloat(searchedLng) });
        setLocationLabel(searchedName || addressQuery.trim());
      }
    } catch (error) {
      alert(`Location search failed: ${error.message}`);
    } finally {
      setIsFetchingStores(false);
    }
  };

  // Upload Callbacks
  const handleUploadStart = () => {
    // Disable active store highlight while new data is loading
    setActiveStoreId(null);
  };

  const handleUploadComplete = (result) => {
    setUploadResult(result);
    setIsModalOpen(true);
    // Reload stores from backend if upload succeeded
    if (result.success) {
      fetchStores();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Section */}
      <Sidebar
        stores={stores}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        radiusVal={radiusVal}
        setRadiusVal={setRadiusVal}
        userLocation={userLocation}
        onLocate={handleLocateUser}
        isLocating={isLocating}
        isFetchingStores={isFetchingStores}
        activeStoreId={activeStoreId}
        setActiveStoreId={setActiveStoreId}
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
        tenants={tenants}
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        onAddressSearch={handleAddressSearch}
      />

      {/* Map View Section */}
      <StoreMap
        stores={stores}
        activeStoreId={activeStoreId}
        setActiveStoreId={setActiveStoreId}
        userLocation={userLocation}
        locationLabel={locationLabel}
      />

      {/* Upload Summary & Logging Modal */}
      <UploadSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        uploadResult={uploadResult}
      />
    </div>
  );
}
