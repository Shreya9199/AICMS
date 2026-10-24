import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime, ForeignKey, Index, JSON, Float
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role:
    COMPLAINANT = "complainant"
    OFFICER = "officer"
    BUREAU_ADMIN = "bureau_admin"
    SUPER_ADMIN = "super_admin"
    INSTITUTION = "institution"

class ComplaintStatus:
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_INFORMATION = "waiting_for_information"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Priority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=Role.COMPLAINANT)
    bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="SET NULL"), nullable=True)
    institution_name = Column(String(255), nullable=True, index=True)
    institute_code = Column(String(100), nullable=True, index=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    bureau = relationship("Bureau", back_populates="users")
    complaints_filed = relationship("Complaint", back_populates="complainant", foreign_keys="Complaint.complainant_id")
    complaints_assigned = relationship("Complaint", back_populates="assigned_officer", foreign_keys="Complaint.assigned_officer_id")
    status_history_entries = relationship("StatusHistory", back_populates="actor")
    internal_notes = relationship("InternalNote", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="actor")
    notifications = relationship("Notification", back_populates="user")


class Bureau(Base):
    __tablename__ = "bureaus"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="bureau")
    complaints = relationship("Complaint", back_populates="bureau")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_number = Column(String(32), unique=True, index=True, nullable=False)
    complainant_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bureau_id = Column(String(36), ForeignKey("bureaus.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    institution_name = Column(String(255), nullable=False, index=True)
    institute_code = Column(String(100), nullable=True, index=True)
    institution_state = Column(String(100), nullable=False, index=True)
    priority = Column(String(50), nullable=False, default=Priority.MEDIUM)
    status = Column(String(50), nullable=False, default=ComplaintStatus.SUBMITTED, index=True)

    # Institutional compliance & action fields
    action_required = Column(Text, nullable=True)
    institutional_response = Column(Text, nullable=True)
    institutional_response_at = Column(DateTime, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    due_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    complainant = relationship("User", foreign_keys=[complainant_id], back_populates="complaints_filed")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id], back_populates="complaints_assigned")
    bureau = relationship("Bureau", back_populates="complaints")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.created_at.desc()")
    internal_notes = relationship("InternalNote", back_populates="complaint", cascade="all, delete-orphan", order_by="InternalNote.created_at.desc()")
    duplicate_matches = relationship("DuplicateMatch", foreign_keys="DuplicateMatch.complaint_id", back_populates="complaint", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="attachments")


class StatusHistory(Base):
    __tablename__ = "status_histories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    public_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="status_history")
    actor = relationship("User", back_populates="status_history_entries")


class InternalNote(Base):
    __tablename__ = "internal_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="internal_notes")
    author = relationship("User", back_populates="internal_notes")


class DuplicateMatch(Base):
    __tablename__ = "duplicate_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    possible_duplicate_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    match_reason = Column(Text, nullable=False)
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision = Column(String(50), nullable=True)  # confirmed, dismissed, merged_reference
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", foreign_keys=[complaint_id], back_populates="duplicate_matches")
    possible_duplicate = relationship("Complaint", foreign_keys=[possible_duplicate_id])
    reviewer = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(String(50), nullable=False)  # email, in_app
    event_type = Column(String(100), nullable=False)
    sent_at = Column(DateTime, nullable=True)
    delivery_status = Column(String(50), nullable=False, default="pending")  # sent, failed, logged_mock
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint")
