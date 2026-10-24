from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "complainant"
    bureau_id: Optional[str] = None
    active: bool = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "complainant"
    bureau_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    bureau_name: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Bureau Schemas
class BureauBase(BaseModel):
    name: str
    description: Optional[str] = None
    active: bool = True

class BureauCreate(BureauBase):
    pass

class BureauResponse(BureauBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Attachment Schemas
class AttachmentResponse(BaseModel):
    id: str
    original_filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Status History Schemas
class StatusHistoryResponse(BaseModel):
    id: str
    old_status: Optional[str] = None
    new_status: str
    public_note: Optional[str] = None
    created_at: datetime
    changed_by_name: Optional[str] = "System / Official"

    class Config:
        from_attributes = True

# Internal Note Schemas
class InternalNoteCreate(BaseModel):
    body: str

class InternalNoteResponse(BaseModel):
    id: str
    body: str
    created_at: datetime
    author_id: Optional[str] = None
    author_name: Optional[str] = "Official"

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    subject: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=20)
    category: str
    institution_name: str
    institution_state: str
    priority: Optional[str] = "medium"

class ComplaintStatusUpdate(BaseModel):
    status: str
    public_note: Optional[str] = None

class ComplaintAssignUpdate(BaseModel):
    bureau_id: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    public_note: Optional[str] = None

class DuplicateMatchResponse(BaseModel):
    id: str
    possible_duplicate_id: str
    possible_duplicate_number: Optional[str] = None
    possible_duplicate_subject: Optional[str] = None
    similarity_score: float
    match_reason: str
    decision: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DuplicateDecisionUpdate(BaseModel):
    decision: str  # confirmed, dismissed, merged_reference

# Public / Portal Complaint Response (Safe)
class ComplaintPortalResponse(BaseModel):
    id: str
    complaint_number: str
    subject: str
    description: str
    category: str
    institution_name: str
    institution_state: str
    status: str
    priority: str
    submitted_at: datetime
    updated_at: datetime
    due_at: datetime
    resolved_at: Optional[datetime] = None
    attachments: List[AttachmentResponse] = []
    status_history: List[StatusHistoryResponse] = []

    class Config:
        from_attributes = True

# Admin / Official Complaint Response (Full)
class ComplaintAdminResponse(ComplaintPortalResponse):
    complainant_id: str
    complainant_name: Optional[str] = None
    complainant_email: Optional[str] = None
    bureau_id: Optional[str] = None
    bureau_name: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    is_overdue: bool = False
    internal_notes: List[InternalNoteResponse] = []
    duplicate_matches: List[DuplicateMatchResponse] = []

    class Config:
        from_attributes = True

class ComplaintListResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

# Analytics Schemas
class AnalyticsSummary(BaseModel):
    total_complaints: int
    open_complaints: int
    overdue_complaints: int
    resolved_complaints: int
    escalated_complaints: int
    status_counts: dict
    category_counts: dict
    monthly_trend: List[dict]
