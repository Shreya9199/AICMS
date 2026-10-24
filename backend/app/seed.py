import os
import sys
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Bureau, Complaint, StatusHistory, InternalNote, Role, ComplaintStatus, Priority
from app.services.workflow_service import generate_complaint_number

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding demo bureaus...")
        bureaus = [
            Bureau(name="Approvals & Affiliation Bureau", description="Deals with institutional approvals, accreditation, and affiliation non-compliance."),
            Bureau(name="Finance & Fee Regulation Bureau", description="Handles grievances regarding capitation fees, unauthorized charges, and delayed scholarships."),
            Bureau(name="Academic Standards & Curriculum Bureau", description="Monitors syllabus standards, faculty ratios, exam irregularities, and grading disputes."),
            Bureau(name="Anti-Ragging & Campus Safety Bureau", description="High-priority bureau managing student safety, ragging prevention, and discrimination claims.")
        ]
        db.add_all(bureaus)
        db.commit()
        for b in bureaus:
            db.refresh(b)

        print("Seeding demo users for each role...")
        default_pw = get_password_hash("password123")

        # Super Admin
        super_admin = User(
            name="Rajesh Sharma (National Admin)",
            email="superadmin@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.SUPER_ADMIN,
            bureau_id=None,
            active=True
        )

        # Bureau Admins
        bureau_admin_finance = User(
            name="Dr. Anita Desai (Finance Head)",
            email="bureauadmin@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.BUREAU_ADMIN,
            bureau_id=bureaus[1].id,  # Finance Bureau
            active=True
        )

        bureau_admin_approvals = User(
            name="Prof. Suresh Menon (Approvals Head)",
            email="approvals_admin@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.BUREAU_ADMIN,
            bureau_id=bureaus[0].id,
            active=True
        )

        # Officers
        officer_vikram = User(
            name="Vikram Patel (Senior Officer)",
            email="officer@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.OFFICER,
            bureau_id=bureaus[1].id,  # Finance
            active=True
        )

        officer_priya = User(
            name="Priya Nair (Investigation Officer)",
            email="officer_priya@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.OFFICER,
            bureau_id=bureaus[0].id,  # Approvals
            active=True
        )

        # Complainants
        complainant_aarav = User(
            name="Aarav Gupta",
            email="complainant@nivaran.gov.in",
            password_hash=default_pw,
            role=Role.COMPLAINANT,
            bureau_id=None,
            active=True
        )

        complainant_meera = User(
            name="Meera Sen",
            email="meera@example.com",
            password_hash=default_pw,
            role=Role.COMPLAINANT,
            bureau_id=None,
            active=True
        )

        users = [
            super_admin, bureau_admin_finance, bureau_admin_approvals,
            officer_vikram, officer_priya, complainant_aarav, complainant_meera
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)

        print("Seeding realistic sample complaints...")
        now = datetime.utcnow()

        c1 = Complaint(
            complaint_number="NIV-2026-F89A2",
            complainant_id=complainant_aarav.id,
            bureau_id=bureaus[1].id,
            assigned_officer_id=officer_vikram.id,
            subject="Demanding mandatory caution deposit refund refusal upon graduation",
            description="The institution Apex Institute of Engineering is withholding the security caution deposit of Rs. 25,000 despite obtaining a complete No Objection Certificate in May 2026.",
            category="Fee & Financial Grievance",
            institution_name="Apex Institute of Engineering & Technology",
            institution_state="Maharashtra",
            priority=Priority.HIGH,
            status=ComplaintStatus.IN_PROGRESS,
            submitted_at=now - timedelta(days=6),
            updated_at=now - timedelta(days=2),
            due_at=now + timedelta(days=8)
        )

        c2 = Complaint(
            complaint_number="NIV-2026-B32C1",
            complainant_id=complainant_aarav.id,
            bureau_id=bureaus[0].id,
            assigned_officer_id=officer_priya.id,
            subject="Faculty shortage and non-compliance with student-teacher ratio in CS dept",
            description="The Computer Science department lacks sanctioned permanent faculty. Over 180 students are taught by only two visiting adjunct tutors, impacting curriculum delivery.",
            category="Infrastructure & Faculty",
            institution_name="National College of Advanced Studies",
            institution_state="Karnataka",
            priority=Priority.MEDIUM,
            status=ComplaintStatus.WAITING_FOR_INFORMATION,
            submitted_at=now - timedelta(days=12),
            updated_at=now - timedelta(days=3),
            due_at=now + timedelta(days=2)
        )

        c3 = Complaint(
            complaint_number="NIV-2026-K94E7",
            complainant_id=complainant_meera.id,
            bureau_id=bureaus[1].id,
            assigned_officer_id=officer_vikram.id,
            subject="Refusal to return caution deposit and excessive penalty charges",
            description="Apex Institute is demanding an extra fine of Rs 15,000 and denying refund of security deposit for computer science batch.",
            category="Fee & Financial Grievance",
            institution_name="Apex Institute of Engineering & Technology",
            institution_state="Maharashtra",
            priority=Priority.URGENT,
            status=ComplaintStatus.ESCALATED,
            submitted_at=now - timedelta(days=20),
            updated_at=now - timedelta(days=1),
            due_at=now - timedelta(days=6)  # OVERDUE
        )

        c4 = Complaint(
            complaint_number="NIV-2026-M15Q9",
            complainant_id=complainant_meera.id,
            bureau_id=bureaus[3].id,
            assigned_officer_id=None,
            subject="Repeated verbal harassment and hostel ragging incident",
            description="First year students at Block B hostel subjected to late night hazing and abusive interrogations by senior batch.",
            category="Campus Safety & Ragging",
            institution_name="Greenwood Polytechnic University",
            institution_state="Delhi NCR",
            priority=Priority.URGENT,
            status=ComplaintStatus.SUBMITTED,
            submitted_at=now - timedelta(hours=5),
            updated_at=now - timedelta(hours=5),
            due_at=now + timedelta(days=7)
        )

        c5 = Complaint(
            complaint_number="NIV-2026-Z71R4",
            complainant_id=complainant_aarav.id,
            bureau_id=bureaus[2].id,
            assigned_officer_id=None,
            subject="Exam mark sheet withholding and arbitrary re-evaluation surcharge",
            description="Semester 6 marksheets have been delayed by 4 months, affecting post-graduate university application deadlines.",
            category="Academic & Examinations",
            institution_name="Sunrise College of Technology",
            institution_state="Tamil Nadu",
            priority=Priority.MEDIUM,
            status=ComplaintStatus.RESOLVED,
            submitted_at=now - timedelta(days=25),
            updated_at=now - timedelta(days=4),
            due_at=now - timedelta(days=11),
            resolved_at=now - timedelta(days=4)
        )

        complaints = [c1, c2, c3, c4, c5]
        db.add_all(complaints)
        db.commit()
        for c in complaints:
            db.refresh(c)

        print("Seeding status history and internal notes...")
        h1 = StatusHistory(
            complaint_id=c1.id,
            changed_by=complainant_aarav.id,
            old_status=None,
            new_status=ComplaintStatus.SUBMITTED,
            public_note="Complaint submitted with proof of clearance receipt.",
            created_at=c1.submitted_at
        )
        h2 = StatusHistory(
            complaint_id=c1.id,
            changed_by=bureau_admin_finance.id,
            old_status=ComplaintStatus.SUBMITTED,
            new_status=ComplaintStatus.ASSIGNED,
            public_note="Allocated to Senior Officer Vikram Patel for financial audit.",
            created_at=c1.submitted_at + timedelta(days=1)
        )
        h3 = StatusHistory(
            complaint_id=c1.id,
            changed_by=officer_vikram.id,
            old_status=ComplaintStatus.ASSIGNED,
            new_status=ComplaintStatus.IN_PROGRESS,
            public_note="Notice issued to college bursar requesting transaction ledger.",
            created_at=c1.submitted_at + timedelta(days=4)
        )

        # Internal notes (Official only)
        n1 = InternalNote(
            complaint_id=c1.id,
            author_id=officer_vikram.id,
            body="Called Dean of Student Welfare. College claims clearance forms were missing stamps. Auditor scheduled for inspection.",
            created_at=c1.submitted_at + timedelta(days=4, hours=2)
        )
        n2 = InternalNote(
            complaint_id=c3.id,
            author_id=bureau_admin_finance.id,
            body="Notice: Apex Institute has 3 other similar complaints this quarter. Flagged for institutional disciplinary hearing.",
            created_at=c3.submitted_at + timedelta(days=15)
        )

        db.add_all([h1, h2, h3, n1, n2])
        db.commit()

        print("Seeding demo duplicate match record...")
        from app.models import DuplicateMatch
        dup = DuplicateMatch(
            complaint_id=c3.id,
            possible_duplicate_id=c1.id,
            similarity_score=0.84,
            match_reason="Same Institution: 'Apex Institute of Engineering & Technology'; Same Grievance Category: 'Fee & Financial Grievance'; Semantic similarity 89% on caution deposit withholding.",
            decision=None
        )
        db.add(dup)
        db.commit()

        print("Seeding completed successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
