import pytest
from app.database.session import SessionLocal
from app.api.v1.auth import login, register
from app.schemas.auth import UserLogin, UserRegister
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from fastapi import HTTPException
import uuid

def test_password_hashing_and_verification():
    raw_pwd = "SuperSecretPassword2026!"
    hashed = get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload_data = {"sub": "analyst", "role": "Security Analyst"}
    token = create_access_token(payload_data)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "analyst"
    assert decoded["role"] == "Security Analyst"

def test_login_admin_success():
    db = SessionLocal()
    try:
        login_data = UserLogin(username="admin", password="Admin@CyberSentinel2026!")
        token_resp = login(login_data, db)
        assert token_resp.access_token is not None
        assert token_resp.token_type == "bearer"
        assert token_resp.user.username == "admin"
        assert token_resp.user.role == "Administrator"
    finally:
        db.close()

def test_login_invalid_password():
    db = SessionLocal()
    try:
        login_data = UserLogin(username="admin", password="IncorrectPassword999!")
        with pytest.raises(HTTPException) as exc_info:
            login(login_data, db)
        assert exc_info.value.status_code == 401
    finally:
        db.close()

def test_user_registration_and_duplicate_check():
    db = SessionLocal()
    try:
        rand_id = str(uuid.uuid4())[:8]
        new_username = f"soc_user_{rand_id}"
        new_email = f"user_{rand_id}@cybersentinel.local"

        reg_data = UserRegister(
            username=new_username,
            email=new_email,
            password="NewUserSecurePass2026!",
            full_name="SOC Automation Analyst",
            role="Security Analyst"
        )
        user_resp = register(reg_data, db)
        assert user_resp.username == new_username
        assert user_resp.email == new_email

        # Duplicate registration should raise 400 Bad Request
        with pytest.raises(HTTPException) as exc_info:
            register(reg_data, db)
        assert exc_info.value.status_code == 400
    finally:
        db.close()
