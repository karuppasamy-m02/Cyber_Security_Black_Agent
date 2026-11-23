from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ThreatIndicatorCreate(BaseModel):
    indicator_type: str  # ip, domain, md5, sha256
    indicator_value: str
    threat_score: float = 75.0
    malware_family: Optional[str] = None
    mitre_technique: Optional[str] = None
    description: Optional[str] = None
    confidence: str = "High"

class ThreatIndicatorResponse(BaseModel):
    id: str
    indicator_type: str
    indicator_value: str
    threat_score: float
    malware_family: Optional[str] = None
    mitre_technique: Optional[str] = None
    description: Optional[str] = None
    confidence: str
    source_name: Optional[str] = "Local Intelligence"
    created_at: datetime

    class Config:
        from_attributes = True

class ThreatInvestigationRequest(BaseModel):
    query: str  # IP or domain

class ThreatInvestigationResult(BaseModel):
    query: str
    indicator_type: str
    is_malicious: bool
    reputation_score: float
    matched_indicator: Optional[ThreatIndicatorResponse] = None
    mitre_techniques: List[str] = []
    related_events_count: int = 0
    recommendations: List[str] = []
