import json
import os
from typing import List, Dict, Any, Optional
from backend.config import STORES_FILE
from backend.utils.distance import calculate_haversine_distance

class StoreService:
    def __init__(self):
        self.stores_path = STORES_FILE
        self._ensure_default_stores()

    def _ensure_default_stores(self):
        """
        Seeding 3 active stores if stores.json does not exist.
        Migrates existing records to add 'tenant_id' if missing.
        """
        if not os.path.exists(self.stores_path):
            default_stores = []
            os.makedirs(os.path.dirname(self.stores_path), exist_ok=True)
            self.save_stores(default_stores)
        else:
            # Migration: Ensure all existing stores have tenant_id
            stores = self.load_stores()
            modified = False
            for s in stores:
                if "tenant_id" not in s:
                    s["tenant_id"] = "VPRO"
                    modified = True
            if modified:
                self.save_stores(stores)

    def load_stores(self) -> List[Dict[str, Any]]:
        """
        Reads and returns active stores from stores.json.
        """
        if not os.path.exists(self.stores_path):
            return []
        try:
            with open(self.stores_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []

    def save_stores(self, stores: List[Dict[str, Any]]) -> None:
        """
        Saves a list of stores to stores.json.
        """
        with open(self.stores_path, "w", encoding="utf-8") as f:
            json.dump(stores, f, indent=2, ensure_ascii=False)

    def get_stores_filtered(
        self,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[float] = None,
        search: Optional[str] = None,
        tenant_id: str = "VPRO"
    ) -> List[Dict[str, Any]]:
        """
        Filters and sorts active stores based on tenant_id, search terms, and location coordinates.
        """
        stores = self.load_stores()
        filtered = []

        # Convert search query to lowercase
        search_query = search.strip().lower() if search else None
        target_tenant = tenant_id.strip().upper()

        for store in stores:
            # 1. Tenant Filter (default empty to VPRO for backward compatibility)
            s_tenant = str(store.get("tenant_id", "VPRO")).strip().upper()
            if s_tenant != target_tenant:
                continue

            # 2. Search Query Filter (Name & City)
            if search_query:
                name_match = search_query in store.get("name", "").lower()
                city_match = search_query in store.get("city", "").lower()
                if not (name_match or city_match):
                    continue

            # 3. Distance calculation if user location is available
            dist = None
            if lat is not None and lng is not None:
                try:
                    s_lat = float(store["latitude"])
                    s_lng = float(store["longitude"])
                    dist = calculate_haversine_distance(lat, lng, s_lat, s_lng)
                    store["distance"] = round(dist, 2)
                except (ValueError, KeyError, TypeError):
                    store["distance"] = None
            else:
                store["distance"] = None

            # 4. Radius Filter
            if radius is not None and dist is not None:
                if dist > radius:
                    continue

            filtered.append(store)

        # 5. Sorting: Sort by distance if calculated, otherwise sort by Name
        if lat is not None and lng is not None:
            filtered.sort(key=lambda s: (s.get("distance") is None, s.get("distance", float('inf'))))
        else:
            filtered.sort(key=lambda s: s.get("name", "").lower())

        return filtered
