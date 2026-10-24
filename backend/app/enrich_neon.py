import os
import sys
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Bureau, Complaint, StatusHistory, InternalNote, DuplicateMatch, Role, ComplaintStatus, Priority

def enrich_data():
    db = SessionLocal()
    try:
        bureaus = db.query(Bureau).all()
        if not bureaus:
            print("No bureaus found. Please run seed.py first.")
            return

        users = db.query(User).all()
        complainants = [u for u in users if u.role == Role.COMPLAINANT]
        officers = [u for u in users if u.role == Role.OFFICER]

        if not complainants:
            complainants = [users[0]]
        if not officers:
            officers = [users[0]]

        existing_count = db.query(Complaint).count()
        print(f"Current complaints count in Neon DB: {existing_count}")

        # Realistic institutions matching the screenshot UI
        institutions = [
            ("North Valley Institute of Technology", "Student Development", "Delhi NCR"),
            ("Kaveri College of Engineering", "Finance & Accounts", "Karnataka"),
            ("Rajasthan School of Technology", "Approval Bureau", "Rajasthan"),
            ("Eastern Institute of Applied Sciences", "Student Development", "West Bengal"),
            ("Apex Institute of Engineering & Technology", "Finance & Accounts", "Maharashtra"),
            ("National College of Advanced Studies", "Approval Bureau", "Karnataka"),
            ("St. Xavier Technical Campus", "Anti-Ragging & Safety", "Goa"),
            ("Vellore Academy of Higher Learning", "Academic Standards", "Tamil Nadu"),
            ("Himalayan Institute of Polytechnic", "Student Development", "Uttarakhand"),
            ("Sardar Patel Institute of Tech", "Approval Bureau", "Gujarat"),
            ("Greenwood Polytechnic University", "Anti-Ragging & Safety", "Delhi NCR"),
            ("Sunrise College of Technology", "Academic Standards", "Tamil Nadu")
        ]

        sample_grievances = [
            ("Scholarship disbursement delayed for final year students", "The post-matric national scholarship sanctioned by the ministry has been withheld by college accounts department for over 5 months despite university clearance.", "Fee & Financial Grievance", ComplaintStatus.UNDER_REVIEW),
            ("Unapproved increase in semester examination fees", "Institute administration arbitrarily levied an additional Rs 8,500 exam fee surcharging students without regulatory approval council notification.", "Fee & Financial Grievance", ComplaintStatus.ESCALATED),
            ("Faculty vacancy not filled for the current academic year", "Computer Science department has 8 sanctioned professor positions lying vacant, violating mandatory 1:20 teacher-student ratio guidelines.", "Infrastructure & Faculty", ComplaintStatus.IN_PROGRESS),
            ("Request for accessibility support in campus facilities", "Academic blocks 3 and 4 lack wheelchair ramps and elevator service for differently-abled engineering students attending classes on upper floors.", "Infrastructure & Faculty", ComplaintStatus.RESOLVED),
            ("Withholding original mark sheets upon degree completion", "College registrar office refuses to return Class 12 passing certificate and provisional degree certificate demanding extra library clearance fees.", "Academic & Examinations", ComplaintStatus.IN_PROGRESS),
            ("Hostel curfew hazing and night-time harassment incident", "Junior hostel inmates at Block C report repeated unauthorized room entries and verbal abuse by senior batch students during examination week.", "Campus Safety & Ragging", ComplaintStatus.ESCALATED),
            ("Capitation fee charged under development fund head", "Management quota admissions require mandatory Rs 1.5 Lakh donation receipt marked under non-refundable institutional development fund.", "Admission & Capitation Malpractice", ComplaintStatus.UNDER_REVIEW),
            ("AICTE approved intake exceeded without infrastructure approval", "Mechanical engineering admitted 240 students against the approved intake limit of 120 students, causing severe laboratory equipment shortages.", "Approvals & Affiliation", ComplaintStatus.WAITING_FOR_INFORMATION),
            ("Delayed semester 4 results affecting campus placement eligibility", "Term examination evaluation delayed by 110 days, preventing final year students from participating in mandatory on-campus recruitment drives.", "Academic & Examinations", ComplaintStatus.RESOLVED),
            ("Arbitrary deduction from security caution deposit", "College deducted Rs 10,000 caution deposit without itemized damage invoices upon student hostel checkout.", "Fee & Financial Grievance", ComplaintStatus.CLOSED),
            ("Inadequate fire safety and emergency exits in chemistry labs", "Organic chemistry research laboratory has blocked secondary fire exit doors and expired fire extinguishers creating safety hazards.", "Campus Safety & Ragging", ComplaintStatus.UNDER_REVIEW),
            ("Laboratory equipment shortage for electronics curriculum", "Microprocessor and DSP laboratory only possesses 4 working trainer kits for an intake batch of 70 students.", "Infrastructure & Faculty", ComplaintStatus.IN_PROGRESS),
        ]

        now = datetime.utcnow()
        new_complaints = []

        for i, (subject, desc, cat, status) in enumerate(sample_grievances):
            inst, bureau_name, state = institutions[i % len(institutions)]
            
            # Map to matching bureau
            matching_bureau = bureaus[i % len(bureaus)]
            for b in bureaus:
                if bureau_name.lower() in b.name.lower():
                    matching_bureau = b
                    break

            comp_num = f"AICTE-2026-{8420 + i}"
            
            # Skip if already exists
            if db.query(Complaint).filter(Complaint.complaint_number == comp_num).first():
                continue

            submitted_days_ago = random.randint(1, 28)
            submitted_date = now - timedelta(days=submitted_days_ago, hours=random.randint(1, 20))
            due_date = submitted_date + timedelta(days=14)

            # Assign officer
            assigned_officer = random.choice(officers) if status != ComplaintStatus.SUBMITTED else None

            c = Complaint(
                complaint_number=comp_num,
                complainant_id=random.choice(complainants).id,
                bureau_id=matching_bureau.id,
                assigned_officer_id=assigned_officer.id if assigned_officer else None,
                subject=subject,
                description=desc,
                category=cat,
                institution_name=inst,
                institution_state=state,
                priority=Priority.URGENT if status == ComplaintStatus.ESCALATED else Priority.MEDIUM,
                status=status,
                submitted_at=submitted_date,
                updated_at=submitted_date + timedelta(days=1),
                due_at=due_date,
                resolved_at=now - timedelta(days=random.randint(1, 5)) if status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] else None
            )
            new_complaints.append(c)

        if new_complaints:
            db.add_all(new_complaints)
            db.commit()
            print(f"Added {len(new_complaints)} new complaints to Neon DB!")
        else:
            print("All sample complaints already present in Neon DB.")

        print(f"Total complaints in Neon DB now: {db.query(Complaint).count()}")

    except Exception as e:
        print(f"Error enriching Neon DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    enrich_data()
