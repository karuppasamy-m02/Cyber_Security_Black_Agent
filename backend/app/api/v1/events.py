from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional, Dict, Any
import csv
import io
import json

from app.database.session import get_db
from app.models.events import SecurityEvent, EventFeatures, DetectionResult
from app.schemas.events import EventIngest, EventImportBatch, SecurityEventResponse, EventDetailResponse
from app.services.event_service import EventService
from app.ml.shap_explainer import ExplainableAI
import numpy as np

router = APIRouter(prefix="/events", tags=["Security Events"])

@router.post("/ingest", response_model=SecurityEventResponse)
async def ingest_event(event_data: EventIngest, db: Session = Depends(get_db)):
    event = await EventService.ingest_single_event(event_data, db)
    det = event.detection_result
    return SecurityEventResponse(
        id=event.id,
        event_hash=event.event_hash,
        source_type=event.source_type,
        source_ip=event.source_ip,
        destination_ip=event.destination_ip,
        source_port=event.source_port,
        destination_port=event.destination_port,
        protocol=event.protocol,
        event_category=event.event_category,
        severity=event.severity,
        timestamp=event.timestamp,
        raw_log=event.raw_log,
        normalized_payload=event.normalized_payload or {},
        is_simulated=event.is_simulated,
        created_at=event.created_at,
        risk_score=det.final_risk_score if det else None,
        layer3_class=det.layer3_class if det else None
    )

@router.post("/import", response_model=Dict[str, Any])
async def import_events_batch(batch_data: EventImportBatch, db: Session = Depends(get_db)):
    processed = await EventService.ingest_batch(batch_data.events, db)
    return {
        "message": f"Successfully ingested {len(processed)} security events",
        "count": len(processed)
    }

@router.post("/import-csv")
async def import_events_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    events_to_ingest = []
    for row in reader:
        raw = row.get("raw_log") or json.dumps(row)
        events_to_ingest.append(EventIngest(
            source_type=row.get("source_type", "csv"),
            source_ip=row.get("source_ip"),
            destination_ip=row.get("destination_ip"),
            source_port=int(row["source_port"]) if row.get("source_port") else None,
            destination_port=int(row["destination_port"]) if row.get("destination_port") else None,
            protocol=row.get("protocol", "TCP"),
            event_category=row.get("event_category", "Authentication"),
            severity=row.get("severity", "Low"),
            raw_log=raw,
            normalized_payload=row,
            is_simulated=True
        ))

    processed = await EventService.ingest_batch(events_to_ingest, db)
    return {"status": "success", "imported": len(processed)}

@router.get("", response_model=Dict[str, Any])
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    severity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent)

    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    if category:
        query = query.filter(SecurityEvent.event_category == category)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                SecurityEvent.source_ip.like(s),
                SecurityEvent.destination_ip.like(s),
                SecurityEvent.raw_log.like(s)
            )
        )

    total = query.count()
    events = (
        query.order_by(desc(SecurityEvent.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for ev in events:
        det = ev.detection_result
        items.append(SecurityEventResponse(
            id=ev.id,
            event_hash=ev.event_hash,
            source_type=ev.source_type,
            source_ip=ev.source_ip,
            destination_ip=ev.destination_ip,
            source_port=ev.source_port,
            destination_port=ev.destination_port,
            protocol=ev.protocol,
            event_category=ev.event_category,
            severity=ev.severity,
            timestamp=ev.timestamp,
            raw_log=ev.raw_log,
            normalized_payload=ev.normalized_payload or {},
            is_simulated=ev.is_simulated,
            created_at=ev.created_at,
            risk_score=det.final_risk_score if det else 0.0,
            layer3_class=det.layer3_class if det else None
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")

    det = event.detection_result
    feat = event.features

    # Generate SHAP explanation if not cached
    shap_explanation = {}
    if det:
        feat_dict = feat.extracted_features_json if feat else {}
        feature_vector = np.array([[
            float(feat_dict.get("failed_attempts", 0)),
            float(feat_dict.get("dst_port", 80)),
            float(feat_dict.get("bytes_in", 0)) / 1000.0,
            float(feat_dict.get("bytes_out", 0)) / 1000.0,
            float(feat_dict.get("packet_count", 5)),
            10.0,
            1.0 if feat_dict.get("is_root") else 0.0,
            float(feat_dict.get("distinct_ports", 1))
        ]])
        shap_explanation = ExplainableAI.explain_instance(
            features=feature_vector,
            predicted_class=det.layer3_class or "Suspicious",
            confidence=det.layer3_confidence or 0.85
        )

    return EventDetailResponse(
        id=event.id,
        event_hash=event.event_hash,
        source_type=event.source_type,
        source_ip=event.source_ip,
        destination_ip=event.destination_ip,
        source_port=event.source_port,
        destination_port=event.destination_port,
        protocol=event.protocol,
        event_category=event.event_category,
        severity=event.severity,
        timestamp=event.timestamp,
        raw_log=event.raw_log,
        normalized_payload=event.normalized_payload or {},
        is_simulated=event.is_simulated,
        created_at=event.created_at,
        risk_score=det.final_risk_score if det else None,
        layer3_class=det.layer3_class if det else None,
        features=feat.extracted_features_json if feat else {},
        detection={
            "layer1_rule_hits": det.layer1_rule_hits if det else [],
            "layer2_anomaly_score": det.layer2_anomaly_score if det else 0.0,
            "layer3_class": det.layer3_class if det else "Unknown",
            "layer3_confidence": det.layer3_confidence if det else 0.0,
            "layer4_correlation_id": det.layer4_correlation_id if det else None,
            "final_risk_score": det.final_risk_score if det else 0.0,
            "severity": det.severity if det else "Low",
            "xai_explanation": shap_explanation
        } if det else None
    )

@router.delete("/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
