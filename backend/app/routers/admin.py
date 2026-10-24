from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.core.database import get_db
from app.core.deps import require_official, get_current_user
from app.models import (
    User, Complaint, Attachment, StatusHistory, InternalNote, AuditLog,
    DuplicateMatch, Bureau, Role, ComplaintStatus
)
from app.schemas import (
    ComplaintAdminResponse, ComplaintStatusUpdate, ComplaintAssignUpdate,
    InternalNoteCreate, InternalNoteResponse, AttachmentResponse,
    StatusHistoryResponse, DuplicateMatchResponse
)
from app.services.workflow_service import is_transition_allowed
from app.services.notification_service import send_notification_email

router = APIRouter(prefix="/admin", tags=["Official Complaint Management"])

def _format_admin_complaint(comp: Complaint) -> ComplaintAdminResponse:
    now = datetime.utcnow()
    is_overdue = False
    if comp.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        if comp.due_at and comp.due_at < now:
            is_overdue = True

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
        StatusHistoryResponse(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            public_note=h.public_note,
            created_at=h.created_at,
            changed_by_name=h.actor.name if h.actor else "System"
        ) for h in comp.status_history
    ]

    notes_list = [
        InternalNoteResponse(
            id=n.id,
            body=n.body,
            created_at=n.created_at,
            author_id=n.author_id,
            author_name=n.author.name if n.author else "Official"
        ) for n in comp.internal_notes
    ]

    duplicate_list = [
        DuplicateMatchResponse(
            id=d.id,
            possible_duplicate_id=d.possible_duplicate_id,
            possible_duplicate_number=d.possible_duplicate.complaint_number if d.possible_duplicate else None,
            possible_duplicate_subject=d.possible_duplicate.subject if d.possible_duplicate else None,
            similarity_score=d.similarity_score,
            match_reason=d.match_reason,
            decision=d.decision,
            created_at=d.created_at
        ) for d in comp.duplicate_matches
    ]

    return ComplaintAdminResponse(
        id=comp.id,
        complaint_number=comp.complaint_number,
        subject=comp.subject,
        description=comp.description,
        category=comp.category,
        institution_name=comp.institution_name,
        institution_state=comp.institution_state,
        status=comp.status,
        priority=comp.priority,
        submitted_at=comp.submitted_at,
        updated_at=comp.updated_at,
        due_at=comp.due_at,
        resolved_at=comp.resolved_at,
        attachments=attachments_list,
        status_history=history_list,
        complainant_id=comp.complainant_id,
        complainant_name=comp.complainant.name if comp.complainant else None,
        complainant_email=comp.complainant.email if comp.complainant else None,
        bureau_id=comp.bureau_id,
        bureau_name=comp.bureau.name if comp.bureau else None,
        assigned_officer_id=comp.assigned_officer_id,
        assigned_officer_name=comp.assigned_officer.name if comp.assigned_officer else None,
        is_overdue=is_overdue,
        internal_notes=notes_list,
        duplicate_matches=duplicate_list
    )

@router.get("/complaints")
def list_complaints(
    status: Optional[str] = None,
    bureau_id: Optional[str] = None,
    category: Optional[str] = None,
    institution: Optional[str] = None,
    search: Optional[str] = None,
    overdue_only: Optional[bool] = False,
    assigned_to_me: Optional[bool] = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Scoping by Role:
    # 1. Super Admin: full visibility
    # 2. Bureau Admin: complaints within their bureau
    # 3. Officer: assigned to them, or within their bureau
    if current_user.role == Role.SUPER_ADMIN:
        if bureau_id:
            query = query.filter(Complaint.bureau_id == bureau_id)
    elif current_user.role == Role.BUREAU_ADMIN:
        query = query.filter(Complaint.bureau_id == current_user.bureau_id)
    elif current_user.role == Role.OFFICER:
        if assigned_to_me:
            query = query.filter(Complaint.assigned_officer_id == current_user.id)
        else:
            # Can view complaints assigned to them or unassigned/in their bureau
            query = query.filter(
                or_(
                    Complaint.assigned_officer_id == current_user.id,
                    Complaint.bureau_id == current_user.bureau_id
                )
            )

    # Filters
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if institution:
        query = query.filter(Complaint.institution_name.ilike(f"%{institution}%"))
    if search:
        search_filter = or_(
            Complaint.complaint_number.ilike(f"%{search}%"),
            Complaint.subject.ilike(f"%{search}%"),
            Complaint.institution_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    now = datetime.utcnow()
    if overdue_only:
        query = query.filter(
            Complaint.due_at < now,
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
        )

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    complaints = query.order_by(desc(Complaint.submitted_at)).offset((page - 1) * page_size).limit(page_size).all()
    items = [_format_admin_complaint(c) for c in complaints]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/complaints/{complaint_id}", response_model=ComplaintAdminResponse)
def get_complaint_detail(
    complaint_id: str,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Scope verification
    if current_user.role == Role.BUREAU_ADMIN:
        if comp.bureau_id and comp.bureau_id != current_user.bureau_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Complaint outside your bureau jurisdiction")
    elif current_user.role == Role.OFFICER:
        if comp.assigned_officer_id != current_user.id and comp.bureau_id != current_user.bureau_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _format_admin_complaint(comp)

@router.post("/complaints/{complaint_id}/status", response_model=ComplaintAdminResponse)
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Scope check
    if current_user.role == Role.BUREAU_ADMIN and comp.bureau_id and comp.bureau_id != current_user.bureau_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == Role.OFFICER and comp.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned officer or bureau admin can change status")

    old_status = comp.status
    new_status = payload.status

    if not is_transition_allowed(old_status, new_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{old_status}' to '{new_status}'."
        )

    comp.status = new_status
    comp.updated_at = datetime.utcnow()
    if new_status == ComplaintStatus.RESOLVED:
        comp.resolved_at = datetime.utcnow()

    # Record in StatusHistory (Public Timeline)
    history = StatusHistory(
        complaint_id=comp.id,
        changed_by=current_user.id,
        old_status=old_status,
        new_status=new_status,
        public_note=payload.public_note or f"Status changed to {new_status.replace('_', ' ').title()}"
    )
    db.add(history)

    # Record in AuditLog
    audit = AuditLog(
        actor_id=current_user.id,
        action="STATUS_UPDATED",
        entity_type="complaint",
        entity_id=comp.id,
        metadata_json={
            "old_status": old_status,
            "new_status": new_status,
            "public_note": payload.public_note
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(comp)

    # Notify complainant safely
    if comp.complainant and comp.complainant.email:
        send_notification_email(
            to_email=comp.complainant.email,
            subject=f"Update on Complaint {comp.complaint_number}",
            body_text=f"Dear Complainant,\n\nYour grievance {comp.complaint_number} status has been updated to: {new_status.replace('_', ' ').title()}.\n\nNote: {payload.public_note or 'No additional comment provided.'}",
            complaint_number=comp.complaint_number
        )

    return _format_admin_complaint(comp)

@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintAdminResponse)
def assign_complaint(
    complaint_id: str,
    payload: ComplaintAssignUpdate,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    # Only Bureau Admin or Super Admin can assign
    if current_user.role not in [Role.BUREAU_ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only bureau admins or super admins can assign complaints")

    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Bureau admin can only assign within their bureau
    if current_user.role == Role.BUREAU_ADMIN:
        if comp.bureau_id and comp.bureau_id != current_user.bureau_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign outside your bureau")
        target_bureau_id = current_user.bureau_id
    else:
        target_bureau_id = payload.bureau_id or comp.bureau_id

    # If assigning officer, verify officer exists and belongs to bureau
    assigned_officer = None
    if payload.assigned_officer_id:
        assigned_officer = db.query(User).filter(
            User.id == payload.assigned_officer_id,
            User.role == Role.OFFICER,
            User.active == True
        ).first()
        if not assigned_officer:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned officer not found or invalid role")
        if target_bureau_id and assigned_officer.bureau_id != target_bureau_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Officer does not belong to specified bureau")

    old_officer_id = comp.assigned_officer_id
    comp.bureau_id = target_bureau_id
    comp.assigned_officer_id = payload.assigned_officer_id
    comp.updated_at = datetime.utcnow()

    # Move to ASSIGNED status if currently SUBMITTED or UNDER_REVIEW
    if comp.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] and comp.assigned_officer_id:
        old_status = comp.status
        comp.status = ComplaintStatus.ASSIGNED
        history = StatusHistory(
            complaint_id=comp.id,
            changed_by=current_user.id,
            old_status=old_status,
            new_status=ComplaintStatus.ASSIGNED,
            public_note=payload.public_note or f"Grievance assigned to designated review officer for investigation."
        )
        db.add(history)

    audit = AuditLog(
        actor_id=current_user.id,
        action="COMPLAINT_ASSIGNED",
        entity_type="complaint",
        entity_id=comp.id,
        metadata_json={
            "bureau_id": comp.bureau_id,
            "old_officer_id": old_officer_id,
            "new_officer_id": comp.assigned_officer_id
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(comp)

    return _format_admin_complaint(comp)

@router.post("/complaints/{complaint_id}/notes", response_model=InternalNoteResponse)
def add_internal_note(
    complaint_id: str,
    payload: InternalNoteCreate,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    note = InternalNote(
        complaint_id=comp.id,
        author_id=current_user.id,
        body=payload.body.strip()
    )
    db.add(note)
    
    audit = AuditLog(
        actor_id=current_user.id,
        action="INTERNAL_NOTE_ADDED",
        entity_type="internal_note",
        entity_id=comp.id,
        metadata_json={"complaint_id": comp.id}
    )
    db.add(audit)
    db.commit()
    db.refresh(note)

    return InternalNoteResponse(
        id=note.id,
        body=note.body,
        created_at=note.created_at,
        author_id=note.author_id,
        author_name=current_user.name
    )

@router.post("/complaints/{complaint_id}/escalate", response_model=ComplaintAdminResponse)
def escalate_complaint(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = comp.status
    comp.status = ComplaintStatus.ESCALATED
    comp.updated_at = datetime.utcnow()

    history = StatusHistory(
        complaint_id=comp.id,
        changed_by=current_user.id,
        old_status=old_status,
        new_status=ComplaintStatus.ESCALATED,
        public_note=payload.public_note or "Complaint escalated due to priority/SLA breach."
    )
    db.add(history)

    audit = AuditLog(
        actor_id=current_user.id,
        action="COMPLAINT_ESCALATED",
        entity_type="complaint",
        entity_id=comp.id,
        metadata_json={"reason": payload.public_note}
    )
    db.add(audit)
    db.commit()
    db.refresh(comp)

    return _format_admin_complaint(comp)
