from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ActionCreate(BaseModel):
    incident_id: Optional[str] = None
    action_type: str  # isolate_host, block_ip, revoke_session, reset_password
    target_entity: str
    parameters_json: Optional[Dict[str, Any]] = None
    rollback_instructions: Optional[str] = None

class ActionDecision(BaseModel):
    decision: str  # approve, reject
    reason: Optional[str] = None

class ResponseActionResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    action_type: str
    target_entity: str
    parameters_json: Dict[str, Any]
    status: str
    recommended_by: str
    rollback_instructions: Optional[str] = None
    created_at: datetime
    approvals: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
