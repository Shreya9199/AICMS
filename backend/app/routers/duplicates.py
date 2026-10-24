from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_official, get_current_user
from app.models import User, Complaint, DuplicateMatch, AuditLog
from app.schemas import DuplicateMatchResponse, DuplicateDecisionUpdate

router = APIRouter(prefix="/duplicates", tags=["Duplicate Review"])

@router.get("/complaint/{complaint_id}", response_model=List[DuplicateMatchResponse])
def get_complaint_duplicates(
    complaint_id: str,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    matches = db.query(DuplicateMatch).filter(
        DuplicateMatch.complaint_id == complaint_id
    ).all()
    
    result = []
    for d in matches:
        cand = db.query(Complaint).filter(Complaint.id == d.possible_duplicate_id).first()
        result.append(
            DuplicateMatchResponse(
                id=d.id,
                possible_duplicate_id=d.possible_duplicate_id,
                possible_duplicate_number=cand.complaint_number if cand else "Unknown",
                possible_duplicate_subject=cand.subject if cand else "Unknown",
                similarity_score=d.similarity_score,
                match_reason=d.match_reason,
                decision=d.decision,
                created_at=d.created_at
            )
        )
    return result

@router.post("/{match_id}/decision", response_model=DuplicateMatchResponse)
def decide_duplicate(
    match_id: str,
    payload: DuplicateDecisionUpdate,
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    match = db.query(DuplicateMatch).filter(DuplicateMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate suggestion not found")

    allowed_decisions = ["confirmed", "dismissed", "merged_reference"]
    if payload.decision not in allowed_decisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decision must be one of: {allowed_decisions}"
        )

    match.decision = payload.decision
    match.reviewed_by = current_user.id
    
    audit = AuditLog(
        actor_id=current_user.id,
        action="DUPLICATE_DECISION_RECORDED",
        entity_type="duplicate_match",
        entity_id=match.id,
        metadata_json={"decision": payload.decision, "complaint_id": match.complaint_id}
    )
    db.add(audit)
    db.commit()
    db.refresh(match)

    cand = db.query(Complaint).filter(Complaint.id == match.possible_duplicate_id).first()
    return DuplicateMatchResponse(
        id=match.id,
        possible_duplicate_id=match.possible_duplicate_id,
        possible_duplicate_number=cand.complaint_number if cand else None,
        possible_duplicate_subject=cand.subject if cand else None,
        similarity_score=match.similarity_score,
        match_reason=match.match_reason,
        decision=match.decision,
        created_at=match.created_at
    )
