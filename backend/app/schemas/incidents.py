from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "Medium"
    status: Optional[str] = "New"
    affected_asset: Optional[str] = None
    mitre_tactics: Optional[List[str]] = []
    event_ids: Optional[List[str]] = []

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[str] = None
    resolution_notes: Optional[str] = None

class IncidentAssign(BaseModel):
    user_id: str

class IncidentResponse(BaseModel):
    id: str
    incident_code: str
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    affected_asset: Optional[str] = None
    mitre_tactics: List[str] = []
    created_at: datetime
    updated_at: datetime
    event_count: int = 0

    class Config:
        from_attributes = True

class IncidentDetailResponse(IncidentResponse):
    events: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []
    resolution_notes: Optional[str] = None
