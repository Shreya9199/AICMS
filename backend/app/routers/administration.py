from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.deps import require_super_admin
from app.models import User, Bureau, AuditLog, Role
from app.schemas import UserCreate, UserResponse, BureauCreate, BureauResponse

router = APIRouter(prefix="/system", tags=["System Administration (Super Admin Only)"])

# Bureaus Management
@router.get("/bureaus", response_model=List[BureauResponse])
def list_bureaus(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    return db.query(Bureau).order_by(Bureau.name.asc()).all()

@router.post("/bureaus", response_model=BureauResponse)
def create_bureau(
    payload: BureauCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Bureau).filter(Bureau.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bureau with this name already exists")

    bureau = Bureau(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        active=payload.active
    )
    db.add(bureau)
    db.commit()
    db.refresh(bureau)

    audit = AuditLog(
        actor_id=current_user.id,
        action="BUREAU_CREATED",
        entity_type="bureau",
        entity_id=bureau.id,
        metadata_json={"bureau_name": bureau.name}
    )
    db.add(audit)
    db.commit()
    return bureau

# Users Management
@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.created_at.desc()).all()
    
    result = []
    for u in users:
        b_name = u.bureau.name if u.bureau else None
        result.append(
            UserResponse(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                bureau_id=u.bureau_id,
                bureau_name=b_name,
                active=u.active,
                created_at=u.created_at
            )
        )
    return result

@router.post("/users", response_model=UserResponse)
def create_official_user(
    payload: UserCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    role = payload.role or Role.OFFICER
    if role not in [Role.OFFICER, Role.BUREAU_ADMIN, Role.SUPER_ADMIN, Role.COMPLAINANT]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified")

    if role in [Role.OFFICER, Role.BUREAU_ADMIN] and not payload.bureau_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bureau must be assigned for Officers and Bureau Admins")

    hashed_pw = get_password_hash(payload.password)
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pw,
        role=role,
        bureau_id=payload.bureau_id,
        active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        actor_id=current_user.id,
        action="OFFICIAL_USER_CREATED",
        entity_type="user",
        entity_id=user.id,
        metadata_json={"role": user.role, "bureau_id": user.bureau_id}
    )
    db.add(audit)
    db.commit()

    b_name = user.bureau.name if user.bureau else None
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        bureau_id=user.bureau_id,
        bureau_name=b_name,
        active=user.active,
        created_at=user.created_at
    )

# Bureau-level Officers List for Bureau Admins and Super Admins
@router.get("/officers", response_model=List[UserResponse])
def get_available_officers(
    bureau_id: Optional[str] = None,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == Role.OFFICER, User.active == True)
    if bureau_id:
        query = query.filter(User.bureau_id == bureau_id)
    officers = query.all()
    
    return [
        UserResponse(
            id=o.id,
            name=o.name,
            email=o.email,
            role=o.role,
            bureau_id=o.bureau_id,
            bureau_name=o.bureau.name if o.bureau else None,
            active=o.active,
            created_at=o.created_at
        )
        for o in officers
    ]
