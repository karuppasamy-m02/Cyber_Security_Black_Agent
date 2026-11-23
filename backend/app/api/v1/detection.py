from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from app.database.session import get_db
from app.models.events import SecurityEvent, DetectionRule, DetectionResult
from app.schemas.detection import DetectionAnalyzeRequest, DetectionRuleCreate, DetectionRuleResponse
from app.detection.engine import AMTIEEngine

router = APIRouter(prefix="/detection", tags=["Detection & Rules"])

@router.post("/analyze")
def analyze_events(req: DetectionAnalyzeRequest, db: Session = Depends(get_db)):
    results = []
    for eid in req.event_ids:
        event = db.query(SecurityEvent).filter(SecurityEvent.id == eid).first()
        if event:
            res = AMTIEEngine.process_event(event, db)
            results.append({
                "event_id": eid,
                "risk_score": res.final_risk_score,
                "severity": res.severity,
                "attack_class": res.layer3_class,
                "confidence": res.layer3_confidence,
                "rules_matched": res.layer1_rule_hits
            })
    return {"analyzed_count": len(results), "results": results}

@router.get("/rules", response_model=List[DetectionRuleResponse])
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(DetectionRule).all()
    return rules

@router.post("/rules", response_model=DetectionRuleResponse)
def create_rule(rule_in: DetectionRuleCreate, db: Session = Depends(get_db)):
    rule = DetectionRule(
        id=str(uuid.uuid4()),
        name=rule_in.name,
        rule_type=rule_in.rule_type,
        condition_expression=rule_in.condition_expression,
        severity=rule_in.severity,
        description=rule_in.description,
        is_enabled=True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_enabled = not rule.is_enabled
    db.commit()
    return {"rule_id": rule.id, "is_enabled": rule.is_enabled}
