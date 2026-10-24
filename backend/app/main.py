import os
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, portal, admin, duplicates, analytics, administration

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("nivaran.api")

# Create tables in DB (for SQLite or PostgreSQL dev setup)
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Integrated Institution Complaint Monitoring and Status Dashboard API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev Vite ports and production Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "version": "1.0.0"
    }

# Register API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(portal.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(duplicates.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(administration.router, prefix=settings.API_V1_STR)

# Secure file download endpoint
from fastapi.responses import FileResponse
from app.models import Attachment, User, Role, Complaint
from app.core.deps import get_current_user
from sqlalchemy.orm import Session
from app.core.database import get_db

@app.get("/api/v1/attachments/{attachment_id}/download", tags=["Attachments"])
def download_attachment(
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    comp = db.query(Complaint).filter(Complaint.id == att.complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Scope check: Complainant must own it, or official must have permission
    if current_user.role == Role.COMPLAINANT and comp.complainant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    file_path = os.path.join(settings.UPLOAD_DIR, att.storage_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Stored file missing on disk")

    return FileResponse(
        path=file_path,
        filename=att.original_filename,
        media_type=att.content_type
    )
