from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.users import User, Role, UserSession
from app.models.system import AuditLog
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, PasswordReset
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user_payload
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    # Get or create Role
    role = db.query(Role).filter(Role.name == user_data.role).first()
    if not role:
        role = db.query(Role).filter(Role.name == "Viewer").first()
        if not role:
            role = Role(
                id=str(uuid.uuid4()),
                name="Viewer",
                description="Read-only SOC telemetry viewer",
                permissions_json=["view_events", "view_incidents"]
            )
            db.add(role)
            db.commit()
            db.refresh(role)

    new_user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name or user_data.username,
        role_id=role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        actor_id=new_user.id,
        actor_username=new_user.username,
        action_category="AUTH",
        action_details=f"User {new_user.username} registered with role {role.name}"
    )
    db.add(audit)
    db.commit()

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=role.name,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    role_name = user.role.name if user.role else "Viewer"

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": role_name}
    )

    # Audit log
    audit = AuditLog(
        actor_id=user.id,
        actor_username=user.username,
        action_category="AUTH",
        action_details=f"Successful login from user {user.username}"
    )
    db.add(audit)
    db.commit()

    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=role_name,
        is_active=user.is_active,
        created_at=user.created_at
    )

    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_current_user(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role.name if user.role else "Viewer",
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/logout")
def logout(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    username = payload.get("sub")
    audit = AuditLog(
        actor_id=payload.get("user_id"),
        actor_username=username,
        action_category="AUTH",
        action_details=f"User {username} logged out"
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out"}
