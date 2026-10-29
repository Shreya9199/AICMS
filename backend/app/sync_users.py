import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, Bureau, Role

def verify_and_sync_role_accounts():
    db = SessionLocal()
    try:
        bureaus = db.query(Bureau).all()
        finance_bureau = next((b for b in bureaus if "finance" in b.name.lower()), bureaus[0] if bureaus else None)
        approvals_bureau = next((b for b in bureaus if "approval" in b.name.lower()), bureaus[0] if bureaus else None)
        
        default_pw = get_password_hash("password123")

        # Accounts for each role stored in Neon DB
        role_accounts = [
            {
                "name": "National Administrator",
                "email": "superadmin@nivaran.gov.in",
                "role": Role.SUPER_ADMIN,
                "bureau_id": None
            },
            {
                "name": "Bureau Administrator (Finance)",
                "email": "bureauadmin@nivaran.gov.in",
                "role": Role.BUREAU_ADMIN,
                "bureau_id": finance_bureau.id if finance_bureau else None
            },
            {
                "name": "Grievance Investigation Officer",
                "email": "officer@nivaran.gov.in",
                "role": Role.OFFICER,
                "bureau_id": finance_bureau.id if finance_bureau else None
            },
            {
                "name": "Registered Complainant",
                "email": "complainant@nivaran.gov.in",
                "role": Role.COMPLAINANT,
                "bureau_id": None,
                "institution_name": None,
                "institute_code": None
            },
            {
                "name": "Apex Institute Representative",
                "email": "apex.institute@aicms.ac.in",
                "role": Role.INSTITUTION,
                "bureau_id": None,
                "institution_name": "Apex Institute of Engineering & Technology",
                "institute_code": "1-351299881"
            }
        ]

        for acc in role_accounts:
            existing = db.query(User).filter(User.email == acc["email"]).first()
            if existing:
                existing.name = acc["name"]
                existing.role = acc["role"]
                existing.password_hash = default_pw
                existing.bureau_id = acc.get("bureau_id")
                existing.institution_name = acc.get("institution_name")
                existing.institute_code = acc.get("institute_code")
                existing.active = True
                print(f"Updated user account in Neon DB: {acc['email']} [{acc['role']}]")
            else:
                user = User(
                    name=acc["name"],
                    email=acc["email"],
                    password_hash=default_pw,
                    role=acc["role"],
                    bureau_id=acc.get("bureau_id"),
                    institution_name=acc.get("institution_name"),
                    institute_code=acc.get("institute_code"),
                    active=True
                )
                db.add(user)
                print(f"Created user account in Neon DB: {acc['email']} [{acc['role']}]")

        db.commit()
        print("All role-based accounts verified in Neon DB!")

    except Exception as e:
        print(f"Error syncing users to Neon: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_and_sync_role_accounts()
