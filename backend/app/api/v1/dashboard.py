from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

from app.database.session import get_db
from app.models.events import SecurityEvent, DetectionResult
from app.models.incidents import Incident
from app.models.ml_models import ModelRegistry
from app.models.system import AuditLog
from app.ai.ollama_client import ollama_client

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
async def get_dashboard_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Total events count
    total_events = db.query(SecurityEvent).count()

    # 2. Incident stats
    active_incidents = db.query(Incident).filter(Incident.status.in_(["New", "Investigating"])).count()
    critical_incidents = db.query(Incident).filter(Incident.severity == "Critical").count()

    # 3. High-risk & Anomalies
    critical_threats = db.query(SecurityEvent).filter(SecurityEvent.severity == "Critical").count()
    high_threats = db.query(SecurityEvent).filter(SecurityEvent.severity == "High").count()
    anomalies_detected = db.query(DetectionResult).filter(DetectionResult.final_risk_score >= 60.0).count()

    # 4. Threat categories breakdown
    category_counts = (
        db.query(SecurityEvent.event_category, func.count(SecurityEvent.id))
        .group_by(SecurityEvent.event_category)
        .all()
    )
    threat_categories = {cat: count for cat, count in category_counts}

    # 5. Detection model health
    active_models_count = db.query(ModelRegistry).filter(ModelRegistry.is_active == True).count()
    model_health = "Optimal" if active_models_count >= 2 else ("Degraded" if active_models_count == 1 else "Baseline Heuristics")

    # 6. Ollama Local AI Status
    ollama_health = await ollama_client.check_health()
    available_models = await ollama_client.list_models()

    # 7. Recent Incidents
    recent_incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(5)
        .all()
    )
    recent_incidents_data = [
        {
            "id": inc.id,
            "code": inc.incident_code,
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "affected_asset": inc.affected_asset,
            "created_at": inc.created_at.isoformat()
        }
        for inc in recent_incidents
    ]

    # 8. Recent Activities (from Audit Logs)
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(6)
        .all()
    )
    recent_activities = [
        {
            "id": log.id,
            "actor": log.actor_username,
            "category": log.action_category,
            "details": log.action_details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in recent_logs
    ]

    return {
        "total_events": total_events,
        "active_incidents": active_incidents,
        "critical_threats": critical_threats,
        "high_risk_events": high_threats,
        "anomalies_detected": anomalies_detected,
        "threat_categories": threat_categories,
        "detection_model_health": {
            "status": model_health,
            "active_models": active_models_count
        },
        "ai_engine_status": {
            "is_connected": ollama_health["is_running"],
            "version": ollama_health.get("version"),
            "service_detail": ollama_health["message"],
            "models_count": len(available_models),
            "suggested_model": "qwen2.5:7b"
        },
        "event_processing_rate_eps": round(total_events / max(1, 3600), 2),
        "recent_incidents": recent_incidents_data,
        "recent_activities": recent_activities
    }

@router.get("/trends")
def get_dashboard_trends(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # Group events by hour over the last 24 hours
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)

    events = (
        db.query(SecurityEvent.timestamp, SecurityEvent.severity, SecurityEvent.event_category)
        .filter(SecurityEvent.timestamp >= day_ago)
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    # Bucket into hourly time-series
    hourly_buckets: Dict[str, Dict[str, int]] = {}
    for i in range(24):
        slot = (now - timedelta(hours=23 - i)).strftime("%H:00")
        hourly_buckets[slot] = {"time": slot, "Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Total": 0}

    for ev in events:
        hour_slot = ev.timestamp.strftime("%H:00")
        if hour_slot in hourly_buckets:
            hourly_buckets[hour_slot][ev.severity] = hourly_buckets[hour_slot].get(ev.severity, 0) + 1
            hourly_buckets[hour_slot]["Total"] += 1

    return {
        "timeline": list(hourly_buckets.values()),
        "total_in_period": len(events)
    }
