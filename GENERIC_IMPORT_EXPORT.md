# Generic Import/Export Framework Documentation

This document explains the architecture, layout, and implementation of our generic, entity-agnostic spreadsheet importing framework.

---

## 1. Why the Framework is Generic

The importing framework is completely decoupled from any single entity type (such as Stores). 
- It has **zero awareness** of database columns or business rules like coordinate bounds, store IDs, names, or addresses.
- It operates solely on high-level dictionary row concepts.
- By adhering to the **Strategy Design Pattern** and **Dependency Inversion Principle (SOLID)**, the import runner acts as an abstract processing shell. You can add new entity imports (e.g., Products, Users, Reviews) simply by implementing a new specification class, without modifying any line of code in the core engine.

---

## 2. Folder Structure

```text
backend/
├── config.py                   # Global maps containing mapping configurations and limits
├── services/
│   └── upload_service.py       # Thin entry point wrapper for route orchestration
└── utils/
    ├── header_transformer.py   # Tokenizer that normalizes header cases/whitespace
    ├── generic_importer.py     # Agnostic engine that reads files, chunks, and commits
    └── import_specs/           # Folder containing entity validations and rules
        ├── base_spec.py        # Abstract contract specifying validation hooks
        └── store_spec.py       # Implementation of validators and commits for Stores
```

---

## 3. Architecture & Class Diagram

Here is an ASCII representation showing how the `GenericImporter` utilizes `EntityImportSpec` and `HeaderTransformer` to process files cleanly:

```text
  +-----------------------------------------------------------+
  |                   FastAPI / Upload Route                  |
  +-----------------------------+-----------------------------+
                                |
                                v
  +-----------------------------+-----------------------------+
  |                       UploadService                       |
  +-----------------------------+-----------------------------+
                                | (Instantiates)
                                v
  +-----------------------------+-----------------------------+
  |                      GenericImporter                      |
  +--------+--------------------+--------------------+--------+
           |                                         |
           | (Uses)                                  | (Delegates to)
           v                                         v
+----------+----------+                    +---------+----------+
|  HeaderTransformer  |                    |  EntityImportSpec  |
+---------------------+                    |     (Abstract)     |
                                           +---------+----------+
                                                     |
                                                     | (Inherits)
                                                     v
                                           +---------+----------+
                                           |   StoreImportSpec  |
                                           +---------+----------+
                                                     |
                                                     | (Persists)
                                                     v
                                           +---------+----------+
                                           |     stores.json    |
                                           +--------------------+
```

---

## 4. Component Responsibilities

| Class / Component | Responsibility |
| :--- | :--- |
| **`GenericImporter`** | Streams Excel (row-by-row) or CSV (chunk-by-chunk) files. Runs the import loop, checks missing required headers, aggregates row-level validation errors, coordinates chunk transaction updates, and writes CSV failed rows reports. |
| **`HeaderTransformer`** | Cleans spaces, casing, punctuation, symbols, and underscores from raw column headers to dynamically resolve target mappings. |
| **`EntityImportSpec` (Abstract)** | Establishes the code contract for required properties (`required_fields`, `header_map`) and validator methods (`validate_row`, `check_duplicate`, `normalize_row_for_db`, `commit_chunk`). |
| **`StoreImportSpec`** | Encapsulates store-specific validations (coordinates bounds checks, non-empty name), runs store deduplication, formats models, and commits chunks to the `stores.json` database. |

---

## 5. End-to-End Upload Flow

1. **File Cache & Type Check**: The file bytes are saved to a temporary local cache, and verified for allowed formats (`.csv` / `.xlsx`).
2. **Header Normalization**: The first row is read to extract columns, which are cleaned (punctuation and case-removed) and matched against the configuration target map.
3. **Required Column Check**: If any target listed in `spec.required_fields` is missing, the run immediately aborts with a validation error.
4. **Duplicates Loading**: `spec.initialize_duplicates_tracker()` loads existing records to populate active index structures.
5. **Streaming Chunk Loop**:
   - Rows are read in batches of 50.
   - Each row is validated via `spec.validate_row()`. All validation failures are accumulated.
   - Valid rows undergo deduplication checks via `spec.check_duplicate()`.
   - Valid, non-duplicate rows are reformatted using `spec.normalize_row_for_db()`.
6. **Chunk Commit**: `spec.commit_chunk()` writes successful records in the current chunk. If it fails, those chunk rows are logged as bad.
7. **Report Compilation**: Any failed or duplicate rows are saved to a failed CSV report (`reports/failed_rows_{bulk}.csv`) with an `Error` column. A summary statistics JSON file is saved containing metadata.

---

## 6. How to Add a New Entity (e.g., Products)

To extend the importer for a new entity, do the following:

### Step 1: Add aliases to `backend/config.py`
```python
# Add under config.py
PRODUCT_HEADER_MAP = {
    "product_id": ["productid", "id", "sku", "itemcode"],
    "title": ["title", "name", "productname", "itemname"],
    "price": ["price", "cost", "msrp", "rate"]
}
```

### Step 2: Implement `ProductImportSpec` in `backend/utils/import_specs/product_spec.py`
```python
from backend.utils.import_specs.base_spec import EntityImportSpec
from backend.config import PRODUCT_HEADER_MAP

class ProductImportSpec(EntityImportSpec):
    def __init__(self, product_repository):
        self.repo = product_repository

    @property
    def entity_name(self) -> str:
        return "product"

    @property
    def header_map(self) -> dict:
        return PRODUCT_HEADER_MAP

    @property
    def required_fields(self) -> list:
        return ["product_id", "title", "price"]

    def initialize_duplicates_tracker(self):
        # Load existing SKU ids from products database
        existing_ids = self.repo.get_all_skus()
        return existing_ids, set()

    def validate_row(self, row_num, row_dict, normalized_cols):
        errors = []
        raw_price_col = normalized_cols.get("price")
        price_val = row_dict.get(raw_price_col)
        
        try:
            price = float(price_val)
            if price <= 0.0:
                errors.append("Price must be greater than 0.")
        except (ValueError, TypeError):
            errors.append(f"Invalid price value: '{price_val}'. Must be a float.")
        return errors

    def check_duplicate(self, row_dict, normalized_cols, seen_ids, seen_combos):
        raw_sku_col = normalized_cols.get("product_id")
        sku = str(row_dict.get(raw_sku_col, "")).strip()
        is_dup = sku in seen_ids
        return is_dup, sku, None

    def normalize_row_for_db(self, row_dict, normalized_cols):
        return {
            "sku": str(row_dict[normalized_cols["product_id"]]).strip(),
            "name": str(row_dict[normalized_cols["title"]]).strip(),
            "price": float(row_dict[normalized_cols["price"]])
        }

    def commit_chunk(self, valid_records):
        self.repo.save_batch(valid_records)
```

### Step 3: Run the Import
Simply instantiate the spec and pass it to the generic importer:
```python
spec = ProductImportSpec(product_repo)
importer = GenericImporter(spec, chunk_size=50, reports_dir="data/reports")
result = importer.import_file(file_bytes, "products_2026.csv")
```
No core code changes are required!
