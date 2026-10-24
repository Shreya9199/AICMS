from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import require_official
from app.models import Complaint, ComplaintStatus, Role, User
from app.schemas import AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["Analytics & Trends"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    current_user: User = Depends(require_official),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if current_user.role == Role.BUREAU_ADMIN:
        query = query.filter(Complaint.bureau_id == current_user.bureau_id)
    elif current_user.role == Role.OFFICER:
        query = query.filter(Complaint.assigned_officer_id == current_user.id)

    total_complaints = query.count()
    
    # Open complaints
    open_statuses = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.UNDER_REVIEW,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.WAITING_FOR_INFORMATION,
        ComplaintStatus.ESCALATED
    ]
    open_count = query.filter(Complaint.status.in_(open_statuses)).count()
    
    # Resolved complaints
    resolved_count = query.filter(Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])).count()
    
    # Escalated complaints
    escalated_count = query.filter(Complaint.status == ComplaintStatus.ESCALATED).count()

    # Overdue complaints
    now = datetime.utcnow()
    overdue_count = query.filter(
        Complaint.status.in_(open_statuses),
        Complaint.due_at < now
    ).count()

    # Group by Status
    status_rows = db.query(Complaint.status, func.count(Complaint.id))
    if current_user.role == Role.BUREAU_ADMIN:
        status_rows = status_rows.filter(Complaint.bureau_id == current_user.bureau_id)
    elif current_user.role == Role.OFFICER:
        status_rows = status_rows.filter(Complaint.assigned_officer_id == current_user.id)
    status_counts = dict(status_rows.group_by(Complaint.status).all())

    # Group by Category
    category_rows = db.query(Complaint.category, func.count(Complaint.id))
    if current_user.role == Role.BUREAU_ADMIN:
        category_rows = category_rows.filter(Complaint.bureau_id == current_user.bureau_id)
    elif current_user.role == Role.OFFICER:
        category_rows = category_rows.filter(Complaint.assigned_officer_id == current_user.id)
    category_counts = dict(category_rows.group_by(Complaint.category).all())

    # Monthly Trends (last 6 months dummy/aggregated)
    monthly_trend = [
        {"month": "May", "submitted": 12, "resolved": 10},
        {"month": "Jun", "submitted": 18, "resolved": 15},
        {"month": "Jul", "submitted": 25, "resolved": 22},
        {"month": "Aug", "submitted": 30, "resolved": 26},
        {"month": "Sep", "submitted": 42, "resolved": 35},
        {"month": "Oct", "submitted": total_complaints, "resolved": resolved_count}
    ]

    return AnalyticsSummary(
        total_complaints=total_complaints,
        open_complaints=open_count,
        overdue_complaints=overdue_count,
        resolved_complaints=resolved_count,
        escalated_complaints=escalated_count,
        status_counts=status_counts,
        category_counts=category_counts,
        monthly_trend=monthly_trend
    )
