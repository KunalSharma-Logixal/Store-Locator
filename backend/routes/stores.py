import os
from fastapi import APIRouter, Query, Depends, HTTPException, Response
from typing import List, Dict, Any, Optional
from backend.services.store_service import StoreService
from geopy.exc import GeopyError

router = APIRouter(prefix="/api/stores", tags=["Stores"])

# We can define a dependency to get the store service
def get_store_service():
    return StoreService()

@router.get("", response_model=List[Dict[str, Any]])
def get_stores(
    response: Response,
    address: Optional[str] = Query(None, description="Your City to search nearby stores"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude"),
    radius: Optional[float] = Query(None, description="Radius filter in km"),
    search: Optional[str] = Query(None, description="Search store by name or city"),
    tenant_id: str = Query("VPRO", description="Tenant ID to filter stores by"),
    store_service: StoreService = Depends(get_store_service)
):
    """
    Get active stores. If address is provided, geocode it to get coordinates.
    If lat and lng are provided (or geocoded), calculate distances, filter by radius, and sort stores.
    """
    resolved_lat = lat
    resolved_lng = lng
    
    if address and address.strip():
        from geopy.geocoders import ArcGIS
        try:
            geolocator_arc = ArcGIS(timeout=10)
            location = geolocator_arc.geocode(address.strip())
            if not location:
                raise HTTPException(
                    status_code=404,
                    detail=f"No coordinates found for address search: '{address}'. Please try a different search."
                )
            resolved_lat = location.latitude
            resolved_lng = location.longitude
            
            # Set response headers so frontend knows the geocoded coordinates
            from urllib.parse import quote
            response.headers["X-Searched-Latitude"] = str(resolved_lat)
            response.headers["X-Searched-Longitude"] = str(resolved_lng)
            response.headers["X-Searched-Display-Name"] = quote(location.address)
            response.headers["Access-Control-Expose-Headers"] = "X-Searched-Latitude, X-Searched-Longitude, X-Searched-Display-Name"
            
            print(f"\n[BACKEND CONSOLE] Geocoded Address '{address}' to: Latitude = {resolved_lat}, Longitude = {resolved_lng}\n")
        except GeopyError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Geocoding service error: {str(e)}. Please try again later."
            )
            
    if resolved_lat is not None and resolved_lng is not None:
        print(f"\n[BACKEND CONSOLE] Fetched Nearby Stores for Location: Latitude = {resolved_lat}, Longitude = {resolved_lng}\n")
        
    return store_service.get_stores_filtered(
        lat=resolved_lat, 
        lng=resolved_lng, 
        radius=radius, 
        search=search, 
        tenant_id=tenant_id
    )
