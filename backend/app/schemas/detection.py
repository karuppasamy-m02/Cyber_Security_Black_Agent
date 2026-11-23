from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DetectionAnalyzeRequest(BaseModel):
    event_ids: List[str]

class DetectionResultResponse(BaseModel):
    id: str
    event_id: str
    layer1_rule_hits: List[str]
    layer2_anomaly_score: Optional[float] = None
    layer3_class: Optional[str] = None
    layer3_confidence: Optional[float] = None
    layer4_correlation_id: Optional[str] = None
    final_risk_score: float
    severity: str
    explanation_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class DetectionRuleCreate(BaseModel):
    name: str
    rule_type: str = "threshold"
    condition_expression: Dict[str, Any]
    severity: str = "Medium"
    description: Optional[str] = None

class DetectionRuleResponse(BaseModel):
    id: str
    name: str
    rule_type: str
    condition_expression: Dict[str, Any]
    severity: str
    is_enabled: bool
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
