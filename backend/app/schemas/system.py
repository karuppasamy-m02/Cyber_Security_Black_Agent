from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SystemHealthResponse(BaseModel):
    status: str
    database: Dict[str, Any]
    ai_ollama: Dict[str, Any]
    detection_engine: Dict[str, Any]
    memory_usage_mb: float
    uptime_seconds: float

class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_username: str
    action_category: str
    action_details: str
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    severity: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    setting_value: str
