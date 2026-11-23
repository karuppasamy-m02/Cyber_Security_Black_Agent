from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class EventIngest(BaseModel):
    source_type: str = "json"  # linux_auth, windows_event, network_flow, json, manual
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = "TCP"
    event_category: str = "Authentication"
    severity: Optional[str] = "Low"
    raw_log: str
    normalized_payload: Optional[Dict[str, Any]] = None
    is_simulated: Optional[bool] = False

class EventImportBatch(BaseModel):
    events: List[EventIngest]

class SecurityEventResponse(BaseModel):
    id: str
    event_hash: str
    source_type: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = "TCP"
    event_category: str
    severity: str
    timestamp: datetime
    raw_log: str
    normalized_payload: Dict[str, Any]
    is_simulated: bool
    created_at: datetime
    risk_score: Optional[float] = None
    layer3_class: Optional[str] = None

    class Config:
        from_attributes = True

class EventDetailResponse(SecurityEventResponse):
    features: Optional[Dict[str, Any]] = None
    detection: Optional[Dict[str, Any]] = None
