from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any, Optional
import uuid
import datetime

from app.database.session import get_db
from app.models.incidents import Incident, IncidentEvent
from app.models.events import SecurityEvent
from app.models.users import User
from app.schemas.incidents import IncidentCreate, IncidentUpdate, IncidentAssign, IncidentResponse, IncidentDetailResponse

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=Dict[str, Any])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    total = query.count()
    incidents = (
        query.order_by(desc(Incident.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for inc in incidents:
        assignee_name = inc.assigned_to.username if inc.assigned_to else None
        event_count = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).count()
        items.append(IncidentResponse(
            id=inc.id,
            incident_code=inc.incident_code,
            title=inc.title,
            description=inc.description,
            severity=inc.severity,
            status=inc.status,
            assigned_to_id=inc.assigned_to_id,
            assigned_to_name=assignee_name,
            affected_asset=inc.affected_asset,
            mitre_tactics=inc.mitre_tactics or [],
            created_at=inc.created_at,
            updated_at=inc.updated_at,
            event_count=event_count
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.post("", response_model=IncidentResponse)
def create_incident(inc_data: IncidentCreate, db: Session = Depends(get_db)):
    year = datetime.datetime.now().year
    count = db.query(Incident).count() + 1
    code = f"INC-{year}-{count:04d}"

    incident = Incident(
        id=str(uuid.uuid4()),
        incident_code=code,
        title=inc_data.title,
        description=inc_data.description,
        severity=inc_data.severity,
        status=inc_data.status or "New",
        affected_asset=inc_data.affected_asset,
        mitre_tactics=inc_data.mitre_tactics or ["Initial Access"]
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Link events if supplied
    if inc_data.event_ids:
        for eid in inc_data.event_ids:
            link = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_id=eid
            )
            db.add(link)
        db.commit()

    return IncidentResponse(
        id=incident.id,
        incident_code=incident.incident_code,
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        assigned_to_id=incident.assigned_to_id,
        affected_asset=incident.affected_asset,
        mitre_tactics=incident.mitre_tactics or [],
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        event_count=len(inc_data.event_ids or [])
    )

@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Get linked events
    links = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).all()
    event_ids = [l.event_id for l in links]
    events = db.query(SecurityEvent).filter(SecurityEvent.id.in_(event_ids)).all()

    events_data = []
    timeline_items = []
    for ev in events:
        events_data.append({
            "id": ev.id,
            "timestamp": ev.timestamp.isoformat(),
            "source_ip": ev.source_ip,
            "destination_ip": ev.destination_ip,
            "category": ev.event_category,
            "severity": ev.severity,
            "raw_log": ev.raw_log
        })
        timeline_items.append({
            "timestamp": ev.timestamp.isoformat(),
            "title": f"Telemetry Alert: {ev.event_category}",
            "description": f"{ev.severity} alert from {ev.source_ip} to {ev.destination_ip}",
            "stage": ev.event_category
        })

    # Sort timeline chronologically
    timeline_items.sort(key=lambda x: x["timestamp"])

    assignee_name = inc.assigned_to.username if inc.assigned_to else None

    return IncidentDetailResponse(
        id=inc.id,
        incident_code=inc.incident_code,
        title=inc.title,
        description=inc.description,
        severity=inc.severity,
        status=inc.status,
        assigned_to_id=inc.assigned_to_id,
        assigned_to_name=assignee_name,
        affected_asset=inc.affected_asset,
        mitre_tactics=inc.mitre_tactics or [],
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        event_count=len(events),
        events=events_data,
        timeline=timeline_items,
        resolution_notes=inc.resolution_notes
    )

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: str, update_data: IncidentUpdate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update_data.title:
        inc.title = update_data.title
    if update_data.description:
        inc.description = update_data.description
    if update_data.severity:
        inc.severity = update_data.severity
    if update_data.status:
        inc.status = update_data.status
    if update_data.assigned_to_id:
        inc.assigned_to_id = update_data.assigned_to_id
    if update_data.resolution_notes:
        inc.resolution_notes = update_data.resolution_notes

    db.commit()
    db.refresh(inc)

    assignee_name = inc.assigned_to.username if inc.assigned_to else None
    count = db.query(IncidentEvent).filter(IncidentEvent.incident_id == inc.id).count()

    return IncidentResponse(
        id=inc.id,
        incident_code=inc.incident_code,
        title=inc.title,
        description=inc.description,
        severity=inc.severity,
        status=inc.status,
        assigned_to_id=inc.assigned_to_id,
        assigned_to_name=assignee_name,
        affected_asset=inc.affected_asset,
        mitre_tactics=inc.mitre_tactics or [],
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        event_count=count
    )

@router.post("/{incident_id}/assign")
def assign_incident(incident_id: str, assign_data: IncidentAssign, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    user = db.query(User).filter(User.id == assign_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Target user not found")

    inc.assigned_to_id = user.id
    if inc.status == "New":
        inc.status = "Investigating"
    db.commit()

    return {"message": f"Incident {inc.incident_code} successfully assigned to {user.username}"}
