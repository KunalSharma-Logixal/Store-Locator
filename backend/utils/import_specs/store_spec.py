import os
import json
import uuid
from typing import List, Dict, Any, Tuple, Optional
from backend.utils.import_specs.base_spec import EntityImportSpec
from backend.config import STORES_FILE, HEADER_TRANSFORMATION_MAP
from backend.services.store_service import StoreService

class StoreImportSpec(EntityImportSpec):
    def __init__(self, store_service: StoreService):
        self.store_service = store_service
        self.allowed_tenants = {"VPRO", "VFASHION"}

    @property
    def entity_name(self) -> str:
        return "store"

    @property
    def header_map(self) -> Dict[str, List[str]]:
        return HEADER_TRANSFORMATION_MAP

    @property
    def required_fields(self) -> List[str]:
        return ["name", "latitude", "longitude", "tenant_id"]

    def initialize_duplicates_tracker(self) -> Tuple[set, set]:
        existing_stores = self.store_service.load_stores()
        seen_ids = {str(s["store_id"]).strip() for s in existing_stores if s.get("store_id")}
        seen_combos = {
            (
                str(s.get("tenant_id", "VPRO")).strip().lower(),
                str(s["name"]).strip().lower(),
                round(float(s["latitude"]), 6),
                round(float(s["longitude"]), 6)
            )
            for s in existing_stores if s.get("name") and s.get("latitude") is not None and s.get("longitude") is not None
        }
        return seen_ids, seen_combos

    def validate_row(
        self,
        row_num: int,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any]
    ) -> List[str]:
        row_errors = []
        raw_name_col = normalized_cols.get("name")
        raw_lat_col = normalized_cols.get("latitude")
        raw_lng_col = normalized_cols.get("longitude")
        raw_tenant_col = normalized_cols.get("tenant_id")

        # Tenant checks
        tenant_val = str(row_dict.get(raw_tenant_col, "")).strip() if raw_tenant_col else ""
        if not tenant_val:
            row_errors.append("Tenant ID is empty.")
        elif tenant_val.upper() not in self.allowed_tenants:
            row_errors.append(f"Invalid Tenant ID: '{tenant_val}'. Must be one of {', '.join(sorted(list(self.allowed_tenants)))}.")

        # Name checks
        name = str(row_dict.get(raw_name_col, "")).strip() if raw_name_col else ""
        if not name:
            row_errors.append("Store name is empty.")

        # Latitude checks
        lat_val = row_dict.get(raw_lat_col) if raw_lat_col else None
        try:
            if lat_val is None or str(lat_val).strip() == "":
                row_errors.append("Latitude value is empty.")
            else:
                lat = float(lat_val)
                if not (-90.0 <= lat <= 90.0):
                    row_errors.append(f"Latitude must be between -90 and 90 (got {lat}).")
        except (ValueError, TypeError):
            row_errors.append(f"Invalid latitude value: '{lat_val}'. Must be a float.")

        # Longitude checks
        lng_val = row_dict.get(raw_lng_col) if raw_lng_col else None
        try:
            if lng_val is None or str(lng_val).strip() == "":
                row_errors.append("Longitude value is empty.")
            else:
                lng = float(lng_val)
                if not (-180.0 <= lng <= 180.0):
                    row_errors.append(f"Longitude must be between -180 and 180 (got {lng}).")
        except (ValueError, TypeError):
            row_errors.append(f"Invalid longitude value: '{lng_val}'. Must be a float.")

        return row_errors

    def check_duplicate(
        self,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any],
        seen_ids: set,
        seen_combos: set
    ) -> Tuple[bool, Optional[str], Optional[Tuple]]:
        raw_name_col = normalized_cols.get("name")
        raw_lat_col = normalized_cols.get("latitude")
        raw_lng_col = normalized_cols.get("longitude")
        raw_store_id_col = normalized_cols.get("store_id")
        raw_tenant_col = normalized_cols.get("tenant_id")

        name = str(row_dict.get(raw_name_col, "")).strip() if raw_name_col else ""
        lat_val = row_dict.get(raw_lat_col)
        lng_val = row_dict.get(raw_lng_col)
        store_id = str(row_dict.get(raw_store_id_col, "")).strip() if raw_store_id_col else ""
        tenant_val = str(row_dict.get(raw_tenant_col, "VPRO")).strip().lower()

        # Extract floats safely
        try:
            lat = float(lat_val)
            lng = float(lng_val)
        except (ValueError, TypeError):
            return False, None, None

        if not store_id:
            store_id = f"store_{uuid.uuid4().hex[:8]}"

        combo_key = (tenant_val, name.lower(), round(lat, 6), round(lng, 6))

        is_duplicate = False
        if store_id in seen_ids or combo_key in seen_combos:
            is_duplicate = True

        return is_duplicate, store_id, combo_key

    def normalize_row_for_db(
        self,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any]
    ) -> Dict[str, Any]:
        raw_name_col = normalized_cols.get("name")
        raw_lat_col = normalized_cols.get("latitude")
        raw_lng_col = normalized_cols.get("longitude")
        raw_addr_col = normalized_cols.get("address")
        raw_city_col = normalized_cols.get("city")
        raw_phone_col = normalized_cols.get("phone")
        raw_store_id_col = normalized_cols.get("store_id")
        raw_tenant_col = normalized_cols.get("tenant_id")

        name = str(row_dict.get(raw_name_col, "")).strip() if raw_name_col else ""
        lat = float(row_dict[raw_lat_col])
        lng = float(row_dict[raw_lng_col])
        address = str(row_dict.get(raw_addr_col, "")).strip() if raw_addr_col else ""
        city = str(row_dict.get(raw_city_col, "")).strip() if raw_city_col else ""
        phone = str(row_dict.get(raw_phone_col, "")).strip() if raw_phone_col else ""
        store_id = str(row_dict.get(raw_store_id_col, "")).strip() if raw_store_id_col else ""
        tenant_id = str(row_dict.get(raw_tenant_col, "VPRO")).strip().upper()

        if not store_id:
            store_id = f"store_{uuid.uuid4().hex[:8]}"

        return {
            "tenant_id": tenant_id or "VPRO",
            "store_id": store_id,
            "name": name,
            "address": address,
            "city": city,
            "phone": phone,
            "latitude": lat,
            "longitude": lng
        }

    def commit_chunk(self, valid_records: List[Dict[str, Any]]) -> None:
        if not valid_records:
            return

        active_stores = []
        if os.path.exists(STORES_FILE):
            try:
                with open(STORES_FILE, "r", encoding="utf-8") as f:
                    active_stores = json.load(f)
            except (json.JSONDecodeError, IOError):
                active_stores = []

        active_stores.extend(valid_records)
        
        # Write back to stores.json database
        with open(STORES_FILE, "w", encoding="utf-8") as f:
            json.dump(active_stores, f, indent=2, ensure_ascii=False)
