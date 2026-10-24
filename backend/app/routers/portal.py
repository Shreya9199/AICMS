import os
import uuid
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user, require_complainant, require_institution_or_official
from app.models import User, Complaint, Attachment, StatusHistory, AuditLog, DuplicateMatch, ComplaintStatus, Bureau, Role
from app.schemas import (
    ComplaintCreate, ComplaintPortalResponse, AttachmentResponse, InstitutionResponseSubmit
)
from app.services.workflow_service import generate_complaint_number
from app.services.duplicate_service import detect_duplicates
from app.services.notification_service import send_notification_email
from app.services.gemini_service import analyze_complaint_with_gemini, BUREAU_MAPPING

router = APIRouter(prefix="/portal", tags=["Complaint Portal"])

# Public tracking by complaint number (safe, no internal notes, no complainant personal contact details leaked)
@router.get("/track/{complaint_number}", response_model=ComplaintPortalResponse)
def track_complaint_public(complaint_number: str, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.complaint_number == complaint_number.strip().upper()).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    
    # Format attachments safely
    attachments_list = [
        AttachmentResponse(
            id=a.id,
            original_filename=a.original_filename,
            content_type=a.content_type,
            size_bytes=a.size_bytes,
            uploaded_at=a.uploaded_at
        ) for a in comp.attachments
    ]

    history_list = [
        {
            "id": h.id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "public_note": h.public_note,
            "created_at": h.created_at,
            "changed_by_name": "Official Authority"
        } for h in comp.status_history
    ]

    return ComplaintPortalResponse(
        id=comp.id,
        complaint_number=comp.complaint_number,
        subject=comp.subject,
        description=comp.description,
        category=comp.category,
        institution_name=comp.institution_name,
        institute_code=comp.institute_code,
        institution_state=comp.institution_state,
        status=comp.status,
        priority=comp.priority,
        action_required=comp.action_required,
        institutional_response=comp.institutional_response,
        institutional_response_at=comp.institutional_response_at,
        submitted_at=comp.submitted_at,
        updated_at=comp.updated_at,
        due_at=comp.due_at,
        resolved_at=comp.resolved_at,
        attachments=attachments_list,
        status_history=history_list
    )

@router.post("/complaints", response_model=ComplaintPortalResponse)
def submit_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(require_complainant),
    db: Session = Depends(get_db)
):
    complaint_num = generate_complaint_number()
    due_date = datetime.utcnow() + timedelta(days=settings.DEFAULT_SLA_DAYS)

    # Auto-resolve target Bureau/Cell based on Category & AI triage
    target_bureau_name = BUREAU_MAPPING.get(payload.category.strip(), "Approvals & Affiliation Bureau")
    target_bureau = db.query(Bureau).filter(Bureau.name == target_bureau_name).first()
    bureau_id = target_bureau.id if target_bureau else None

    # Check if priority needs boost based on urgency words
    resolved_priority = payload.priority or "medium"
    if any(urgent_word in (payload.subject + " " + payload.description).lower() for urgent_word in ["ragging", "harassment", "suicide", "safety", "threat"]):
        resolved_priority = "urgent"

    complaint = Complaint(
        complaint_number=complaint_num,
        complainant_id=current_user.id,
        bureau_id=bureau_id,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        institution_name=payload.institution_name.strip(),
        institute_code=payload.institute_code.strip().upper() if payload.institute_code else None,
        institution_state=payload.institution_state.strip(),
        priority=resolved_priority,
        status=ComplaintStatus.SUBMITTED,
        submitted_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        due_at=due_date
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Initial Status History (Public)
    bureau_note_suffix = f" Channeled directly to {target_bureau_name}." if target_bureau else ""
    status_entry = StatusHistory(
        complaint_id=complaint.id,
        changed_by=current_user.id,
        old_status=None,
        new_status=ComplaintStatus.SUBMITTED,
        public_note=f"Complaint registered in portal.{bureau_note_suffix} Available for bureau inquiry officer review."
    )
    db.add(status_entry)

    # Audit Log
    audit = AuditLog(
        actor_id=current_user.id,
        action="COMPLAINT_SUBMITTED",
        entity_type="complaint",
        entity_id=complaint.id,
        metadata_json={
            "complaint_number": complaint.complaint_number,
            "category": complaint.category,
            "institution": complaint.institution_name
        }
    )
    db.add(audit)
    db.commit()

    # Run NLP Duplicate Detection against existing complaints (Non-blocking / Review-only)
    try:
        past_complaints = db.query(Complaint).filter(Complaint.id != complaint.id).limit(100).all()
        candidates = [
            {
                "id": c.id,
                "complaint_number": c.complaint_number,
                "subject": c.subject,
                "description": c.description,
                "category": c.category,
                "institution_name": c.institution_name,
                "institution_state": c.institution_state,
                "submitted_at": c.submitted_at
            }
            for c in past_complaints
        ]
        
        matches = detect_duplicates(
            {
                "id": complaint.id,
                "subject": complaint.subject,
                "description": complaint.description,
                "category": complaint.category,
                "institution_name": complaint.institution_name,
                "institution_state": complaint.institution_state,
                "submitted_at": complaint.submitted_at
            },
            candidates
        )

        for match in matches:
            dup = DuplicateMatch(
                complaint_id=complaint.id,
                possible_duplicate_id=match["possible_duplicate_id"],
                similarity_score=match["similarity_score"],
                match_reason=match["match_reason"]
            )
            db.add(dup)
        db.commit()
    except Exception as e:
        # Graceful failure: duplicate check should never block complaint submission
        print(f"[Duplicate Detection Notice] {e}")

    # Safe Notification Trigger
    send_notification_email(
        to_email=current_user.email,
        subject=f"Grievance Acknowledged - {complaint.complaint_number}",
        body_text=f"Dear {current_user.name},\n\nYour grievance has been registered with reference ID {complaint.complaint_number}.\nYou can track updates anytime on the AICMS portal (AICTE Integrated Case Monitoring System).\n\nSLA Target Resolution Date: {due_date.strftime('%d-%b-%Y')}",
        complaint_number=complaint.complaint_number
    )

    db.refresh(complaint)
    return track_complaint_public(complaint.complaint_number, db)

@router.get("/my-complaints", response_model=List[ComplaintPortalResponse])
def get_my_complaints(
    current_user: User = Depends(require_complainant),
    db: Session = Depends(get_db)
):
    # Enforce strict ownership at query level
    complaints = db.query(Complaint).filter(
        Complaint.complainant_id == current_user.id
    ).order_by(Complaint.submitted_at.desc()).all()

    result = []
    for comp in complaints:
        attachments_list = [
            AttachmentResponse(
                id=a.id,
                original_filename=a.original_filename,
                content_type=a.content_type,
                size_bytes=a.size_bytes,
                uploaded_at=a.uploaded_at
            ) for a in comp.attachments
        ]
        history_list = [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "public_note": h.public_note,
                "created_at": h.created_at,
                "changed_by_name": "Official Authority"
            } for h in comp.status_history
        ]
        result.append(
            ComplaintPortalResponse(
                id=comp.id,
                complaint_number=comp.complaint_number,
                subject=comp.subject,
                description=comp.description,
                category=comp.category,
                institution_name=comp.institution_name,
                institute_code=comp.institute_code,
                institution_state=comp.institution_state,
                status=comp.status,
                priority=comp.priority,
                action_required=comp.action_required,
                institutional_response=comp.institutional_response,
                institutional_response_at=comp.institutional_response_at,
                submitted_at=comp.submitted_at,
                updated_at=comp.updated_at,
                due_at=comp.due_at,
                resolved_at=comp.resolved_at,
                attachments=attachments_list,
                status_history=history_list
            )
        )
    return result

@router.get("/complaints/{complaint_id}", response_model=ComplaintPortalResponse)
def get_my_complaint_detail(
    complaint_id: str,
    current_user: User = Depends(require_complainant),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.complainant_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return track_complaint_public(comp.complaint_number, db)

# ===================== INSTITUTION PORTAL ENDPOINTS =====================
@router.get("/institution/complaints", response_model=List[ComplaintPortalResponse])
def get_institution_complaints(
    current_user: User = Depends(require_institution_or_official),
    db: Session = Depends(get_db)
):
    """
    Returns complaints registered against the logged-in Institution (matched by institute_code or institution_name).
    """
    if current_user.role == Role.INSTITUTION:
        # Match by institute_code if present, or by name case-insensitively
        query = db.query(Complaint)
        if current_user.institute_code:
            query = query.filter(
                (Complaint.institute_code == current_user.institute_code) |
                (Complaint.institution_name.ilike(f"%{current_user.institution_name}%"))
            )
        elif current_user.institution_name:
            query = query.filter(Complaint.institution_name.ilike(f"%{current_user.institution_name}%"))
        else:
            return []
        complaints = query.order_by(Complaint.submitted_at.desc()).all()
    else:
        # Officers can query all or recent
        complaints = db.query(Complaint).order_by(Complaint.submitted_at.desc()).limit(100).all()

    result = []
    for comp in complaints:
        attachments_list = [
            AttachmentResponse(
                id=a.id,
                original_filename=a.original_filename,
                content_type=a.content_type,
                size_bytes=a.size_bytes,
                uploaded_at=a.uploaded_at
            ) for a in comp.attachments
        ]
        history_list = [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "public_note": h.public_note,
                "created_at": h.created_at,
                "changed_by_name": h.actor.name if h.actor else "Official Authority"
            } for h in comp.status_history
        ]
        result.append(
            ComplaintPortalResponse(
                id=comp.id,
                complaint_number=comp.complaint_number,
                subject=comp.subject,
                description=comp.description,
                category=comp.category,
                institution_name=comp.institution_name,
                institute_code=comp.institute_code,
                institution_state=comp.institution_state,
                status=comp.status,
                priority=comp.priority,
                action_required=comp.action_required,
                institutional_response=comp.institutional_response,
                institutional_response_at=comp.institutional_response_at,
                submitted_at=comp.submitted_at,
                updated_at=comp.updated_at,
                due_at=comp.due_at,
                resolved_at=comp.resolved_at,
                attachments=attachments_list,
                status_history=history_list
            )
        )
    return result

@router.post("/institution/complaints/{complaint_id}/respond", response_model=ComplaintPortalResponse)
def submit_institution_response(
    complaint_id: str,
    payload: InstitutionResponseSubmit,
    current_user: User = Depends(require_institution_or_official),
    db: Session = Depends(get_db)
):
    """
    Submits official institution compliance clarification/response to the bureau inquiry.
    """
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if current_user.role == Role.INSTITUTION:
        # Ensure institution belongs to this complaint
        matches = False
        if current_user.institute_code and comp.institute_code and current_user.institute_code.upper() == comp.institute_code.upper():
            matches = True
        elif current_user.institution_name and current_user.institution_name.lower() in comp.institution_name.lower():
            matches = True
        if not matches:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Complaint is not registered under your institution.")

    comp.institutional_response = payload.institutional_response.strip()
    comp.institutional_response_at = datetime.utcnow()
    # Transition status to under_review if was waiting for information
    if comp.status == ComplaintStatus.WAITING_FOR_INFORMATION:
        comp.status = ComplaintStatus.UNDER_REVIEW
    comp.updated_at = datetime.utcnow()

    history = StatusHistory(
        complaint_id=comp.id,
        changed_by=current_user.id,
        old_status=comp.status,
        new_status=comp.status,
        public_note=f"Official Institutional Compliance Statement submitted by {current_user.name} ({comp.institution_name})."
    )
    db.add(history)

    audit = AuditLog(
        actor_id=current_user.id,
        action="INSTITUTION_RESPONSE_SUBMITTED",
        entity_type="complaint",
        entity_id=comp.id,
        metadata_json={
            "institution_name": comp.institution_name,
            "response_preview": payload.institutional_response[:100]
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(comp)

    return track_complaint_public(comp.complaint_number, db)

@router.post("/complaints/{complaint_id}/attachments", response_model=AttachmentResponse)
def upload_complaint_attachment(
    complaint_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_complainant),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.complainant_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Storage key generation (sanitized, private path)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    storage_key = f"{uuid.uuid4()}{ext}"
    destination_path = os.path.join(settings.UPLOAD_DIR, storage_key)

    file_size = 0
    with open(destination_path, "wb") as buffer:
        content = file.file.read()
        file_size = len(content)
        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            os.remove(destination_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        buffer.write(content)

    attachment = Attachment(
        complaint_id=comp.id,
        original_filename=file.filename,
        storage_key=storage_key,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=file_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    audit = AuditLog(
        actor_id=current_user.id,
        action="ATTACHMENT_UPLOADED",
        entity_type="attachment",
        entity_id=attachment.id,
        metadata_json={"filename": file.filename, "complaint_id": comp.id}
    )
    db.add(audit)
    db.commit()

    return attachment
