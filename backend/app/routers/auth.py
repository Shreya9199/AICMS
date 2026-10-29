from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models import User, Role, Bureau, AuditLog
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Complainants and Institutions can register freely. Officers / Admins are provisioned by Super Admin
    role = Role.INSTITUTION if user_in.role == Role.INSTITUTION else Role.COMPLAINANT
    bureau_id = None
    
    try:
        hashed_password = get_password_hash(user_in.password)
        user = User(
            name=user_in.name,
            email=user_in.email.lower().strip(),
            password_hash=hashed_password,
            role=role,
            bureau_id=bureau_id,
            institution_name=user_in.institution_name.strip() if user_in.institution_name else None,
            institute_code=user_in.institute_code.strip().upper() if user_in.institute_code else None,
            active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Log audit
        try:
            audit = AuditLog(
                actor_id=user.id,
                action="USER_REGISTERED",
                entity_type="user",
                entity_id=user.id,
                metadata_json={
                    "role": user.role,
                    "email": user.email,
                    "institution_name": user.institution_name,
                    "institute_code": user.institute_code
                }
            )
            db.add(audit)
            db.commit()
        except Exception:
            db.rollback()

        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    access_token = create_access_token(data={"sub": user.id, "role": user.role, "bureau_id": user.bureau_id})
    
    bureau_name = None
    if user.bureau_id:
        bureau = db.query(Bureau).filter(Bureau.id == user.bureau_id).first()
        if bureau:
            bureau_name = bureau.name

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        bureau_id=user.bureau_id,
        bureau_name=bureau_name,
        institution_name=user.institution_name,
        institute_code=user.institute_code,
        active=user.active,
        created_at=user.created_at
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bureau_name = None
    if current_user.bureau_id:
        bureau = db.query(Bureau).filter(Bureau.id == current_user.bureau_id).first()
        if bureau:
            bureau_name = bureau.name

    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        bureau_id=current_user.bureau_id,
        bureau_name=bureau_name,
        institution_name=current_user.institution_name,
        institute_code=current_user.institute_code,
        active=current_user.active,
        created_at=current_user.created_at
    )
