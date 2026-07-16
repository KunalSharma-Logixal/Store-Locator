import os

# Base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend", "data")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

STORES_FILE = os.path.join(DATA_DIR, "stores.json")
UPLOAD_TEMP_FILE = os.path.join(DATA_DIR, "uploaded_stores.json")
REPORTS_DIR = os.path.join(DATA_DIR, "reports")

# Create reports directory if it doesn't exist
os.makedirs(REPORTS_DIR, exist_ok=True)

# Validation limits & configurations
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
RADIUS_OPTIONS = [5, 10, 20, 50, 100]
CHUNK_SIZE = 50  # Processing chunk size for bulk uploads

# Configurable header transformation map (JSONata-like alias mapping)
# Neutralizes spaces, underscores, symbols, and casing automatically.
HEADER_TRANSFORMATION_MAP = {
    "store_id": ["storeid", "id", "storeidentification", "code"],
    "name": ["name", "storename", "title", "label", "shopname", "storetitle"],
    "address": ["address", "street", "streetaddress", "location", "venue", "addr"],
    "city": ["city", "town", "region", "locality"],
    "phone": ["phone", "phonenumber", "tel", "telephone", "contact", "phone_no"],
    "tenant_id": ["tenantid", "tenant", "tenantcode", "brand"],
    "latitude": ["latitude", "lat", "ycoordinate", "latitudevalue", "latitudecoord", "latitude_val"],
    "longitude": ["longitude", "lng", "lon", "long", "xcoordinate", "longitudevalue", "longitudecoord", "longitude_val"]
}
