import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import DATA_DIR
from backend.services.store_service import StoreService
from backend.routes import stores, upload

# 1. Initialize FastAPI app
app = FastAPI(
    title="Store Locator API",
    description="Backend API for managing, search-filtering, and uploading store data.",
    version="1.0.0"
)

# 2. Add CORS Middleware for local frontend development (e.g. Vite on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Startup Event: Seed initial data
@app.on_event("startup")
def startup_event():
    # Ensure data dir exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Trigger seeding of default 3 stores if missing
    StoreService()

# 4. Include Modular Routes
app.include_router(stores.router)
app.include_router(upload.router)

# Include tenants list route
@app.get("/api/tenants" , tags=["Tenants"])
def get_tenants():
    return ["VPRO", "VFASHION"]

# 5. Serve React Production Build if compiled
dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(dist_dir):
    # Mount assets folder
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    # Serve index.html for all non-api routes to support SPA routing
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        if catchall.startswith("api/"):
            # Let API routes 404 naturally
            return {"detail": "Not Found"}
        return FileResponse(os.path.join(dist_dir, "index.html"))

