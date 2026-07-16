from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import FileResponse
from backend.services.store_service import StoreService
from backend.services.upload_service import UploadService
from backend.config import ALLOWED_EXTENSIONS, REPORTS_DIR
import os
import glob
import json

router = APIRouter(prefix="/api/upload", tags=["Upload File"])

def get_upload_service():
    store_service = StoreService()
    return UploadService(store_service)

@router.post("")
async def upload_stores_file(
    file: UploadFile = File(...),
    upload_service: UploadService = Depends(get_upload_service)
):
    """
    Upload a CSV or Excel store list. Validates contents and,
    if valid, updates the active stores.json database in chunks.
    """
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Only {', '.join(ALLOWED_EXTENSIONS)} are allowed."
        )

    # Verify file size
    # content = await file.read()
    # if len(content) > MAX_FILE_SIZE:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail=f"File size exceeds the limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
    #     )
    
    # Read file content
    content = await file.read()

    # Process and Validate Upload
    result = upload_service.process_upload(content, file.filename)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": result.get("message", "Processing failed."),
                "summary": result["summary"]
            }
        )

    return result

@router.get("/failed-reports/{bulk_no}")
def download_failed_report(bulk_no: str):
    """
    Download the CSV file containing validation failures for a specific bulk upload.
    """
    file_path = os.path.join(REPORTS_DIR, f"failed_rows_{bulk_no}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error report not found for this bulk run."
        )
    return FileResponse(
        path=file_path,
        media_type="text/csv",
        filename=f"failed_rows_{bulk_no}.csv"
    )

@router.get("/summaries")
def get_upload_summaries():
    """
    List all historical upload summaries, sorted by date (newest first).
    """
    summary_files = glob.glob(os.path.join(REPORTS_DIR, "summary_*.json"))
    summaries = []
    
    for filepath in summary_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                summaries.append(data)
        except Exception:
            pass

    # Sort summaries by date descending
    summaries.sort(key=lambda s: s.get("date", ""), reverse=True)
    return summaries
