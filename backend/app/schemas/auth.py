from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions_json: List[str] = []

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "Viewer"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class PasswordReset(BaseModel):
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
