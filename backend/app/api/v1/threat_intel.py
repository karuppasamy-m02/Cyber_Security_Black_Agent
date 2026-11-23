from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid

from app.database.session import get_db
from app.models.threat_intel import ThreatIndicator, ThreatSource
from app.models.events import SecurityEvent
from app.schemas.threat_intel import ThreatIndicatorCreate, ThreatIndicatorResponse, ThreatInvestigationRequest, ThreatInvestigationResult

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])

@router.get("", response_model=Dict[str, Any])
def list_indicators(
    indicator_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ThreatIndicator)
    if indicator_type:
        query = query.filter(ThreatIndicator.indicator_type == indicator_type)

    total = query.count()
    indicators = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for ind in indicators:
        source_name = ind.source.name if ind.source else "Local Intelligence"
        items.append(ThreatIndicatorResponse(
            id=ind.id,
            indicator_type=ind.indicator_type,
            indicator_value=ind.indicator_value,
            threat_score=ind.threat_score,
            malware_family=ind.malware_family,
            mitre_technique=ind.mitre_technique,
            description=ind.description,
            confidence=ind.confidence,
            source_name=source_name,
            created_at=ind.created_at
        ))

    return {"items": items, "total": total, "page": page, "page_size": page_size}

@router.post("/indicators", response_model=ThreatIndicatorResponse)
def add_indicator(indicator_in: ThreatIndicatorCreate, db: Session = Depends(get_db)):
    # Check if already exists
    existing = db.query(ThreatIndicator).filter(
        ThreatIndicator.indicator_value == indicator_in.indicator_value
    ).first()
    if existing:
        return ThreatIndicatorResponse(
            id=existing.id,
            indicator_type=existing.indicator_type,
            indicator_value=existing.indicator_value,
            threat_score=existing.threat_score,
            malware_family=existing.malware_family,
            mitre_technique=existing.mitre_technique,
            description=existing.description,
            confidence=existing.confidence,
            source_name="Local Intelligence",
            created_at=existing.created_at
        )

    new_ind = ThreatIndicator(
        id=str(uuid.uuid4()),
        indicator_type=indicator_in.indicator_type,
        indicator_value=indicator_in.indicator_value,
        threat_score=indicator_in.threat_score,
        malware_family=indicator_in.malware_family,
        mitre_technique=indicator_in.mitre_technique,
        description=indicator_in.description,
        confidence=indicator_in.confidence
    )
    db.add(new_ind)
    db.commit()
    db.refresh(new_ind)

    return ThreatIndicatorResponse(
        id=new_ind.id,
        indicator_type=new_ind.indicator_type,
        indicator_value=new_ind.indicator_value,
        threat_score=new_ind.threat_score,
        malware_family=new_ind.malware_family,
        mitre_technique=new_ind.mitre_technique,
        description=new_ind.description,
        confidence=new_ind.confidence,
        source_name="Local Intelligence",
        created_at=new_ind.created_at
    )

@router.post("/investigate", response_model=ThreatInvestigationResult)
def investigate_indicator(req: ThreatInvestigationRequest, db: Session = Depends(get_db)):
    query_val = req.query.strip()
    is_ip = query_val.replace(".", "").isdigit()
    ind_type = "ip" if is_ip else "domain"

    matched = db.query(ThreatIndicator).filter(ThreatIndicator.indicator_value == query_val).first()

    # Search local telemetry for occurrences of this entity
    related_events_count = db.query(SecurityEvent).filter(
        (SecurityEvent.source_ip == query_val) | (SecurityEvent.destination_ip == query_val)
    ).count()

    if matched:
        is_malicious = matched.threat_score >= 60.0
        reputation = matched.threat_score
        mitre = [matched.mitre_technique] if matched.mitre_technique else ["T1071"]
        matched_resp = ThreatIndicatorResponse(
            id=matched.id,
            indicator_type=matched.indicator_type,
            indicator_value=matched.indicator_value,
            threat_score=matched.threat_score,
            malware_family=matched.malware_family,
            mitre_technique=matched.mitre_technique,
            description=matched.description,
            confidence=matched.confidence,
            source_name="Local Intelligence DB",
            created_at=matched.created_at
        )
    else:
        # Never label an indicator malicious without evidence!
        is_malicious = False
        reputation = 10.0
        mitre = []
        matched_resp = None

    recommendations = []
    if is_malicious:
        recommendations.append(f"Block inbound & outbound traffic to {query_val} on perimeter firewalls")
        recommendations.append("Isolate any internal workstations that established outbound connections to this indicator")
    else:
        recommendations.append("Indicator not present in malicious threat blacklist. Continue normal telemetry monitoring.")

    return ThreatInvestigationResult(
        query=query_val,
        indicator_type=ind_type,
        is_malicious=is_malicious,
        reputation_score=reputation,
        matched_indicator=matched_resp,
        mitre_techniques=mitre,
        related_events_count=related_events_count,
        recommendations=recommendations
    )
