from typing import Dict, Any
from backend.config import REPORTS_DIR, CHUNK_SIZE
from backend.services.store_service import StoreService
from backend.utils.import_specs.store_spec import StoreImportSpec
from backend.utils.generic_importer import GenericImporter

class UploadService:
    def __init__(self, store_service: StoreService):
        self.store_service = store_service

    def process_upload(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Delegates the Excel/CSV spreadsheet parsing and transaction-per-chunk validation 
        to the generic, reusable importer framework using the Store-specific import spec.
        """
        spec = StoreImportSpec(self.store_service)
        importer = GenericImporter(spec, chunk_size=CHUNK_SIZE, reports_dir=REPORTS_DIR)
        return importer.import_file(file_content, filename)
