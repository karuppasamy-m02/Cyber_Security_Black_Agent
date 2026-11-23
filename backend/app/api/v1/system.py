from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any
import psutil
import time
import os
import shutil

from app.database.session import get_db
from app.config import settings
from app.models.system import AuditLog, SystemSetting, Notification
from app.models.users import User, Role
from app.models.events import SecurityEvent, EventFeatures, DetectionResult
from app.models.incidents import Incident, IncidentEvent
from app.models.response import ResponseAction, ApprovalRecord
from app.schemas.system import SystemHealthResponse, AuditLogResponse, NotificationResponse, SystemSettingUpdate
from app.ai.ollama_client import ollama_client

router = APIRouter(prefix="/system", tags=["System Administration"])
START_TIME = time.time()

@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(db: Session = Depends(get_db)):
    # Database check
    try:
        user_count = db.query(User).count()
        db_status = {"status": "healthy", "user_count": user_count, "mode": "WAL"}
    except Exception as e:
        db_status = {"status": "error", "error": str(e)}

    # Ollama AI check
    ollama_health = await ollama_client.check_health()

    # Process Memory
    process = psutil.Process()
    mem_mb = process.memory_info().rss / (1024 * 1024)
    uptime = time.time() - START_TIME

    overall_status = "healthy" if db_status["status"] == "healthy" else "degraded"

    return SystemHealthResponse(
        status=overall_status,
        database=db_status,
        ai_ollama=ollama_health,
        detection_engine={"status": "operational", "layers": 5, "mode": "AMTIE-Active"},
        memory_usage_mb=round(mem_mb, 2),
        uptime_seconds=round(uptime, 1)
    )

@router.get("/audit-logs", response_model=Dict[str, Any])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if category:
        query = query.filter(AuditLog.action_category == category)

    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            AuditLogResponse(
                id=l.id,
                actor_id=l.actor_id,
                actor_username=l.actor_username,
                action_category=l.action_category,
                action_details=l.action_details,
                ip_address=l.ip_address,
                timestamp=l.timestamp
            )
            for l in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/settings")
def get_system_settings(db: Session = Depends(get_db)):
    settings_list = db.query(SystemSetting).all()
    if not settings_list:
        # Seed default settings
        defaults = [
            ("ollama_url", settings.OLLAMA_BASE_URL, "AI", "Endpoint for Ollama daemon"),
            ("default_model", settings.DEFAULT_LLM_MODEL, "AI", "Primary reasoning model"),
            ("event_retention_days", "90", "General", "Log retention period"),
            ("simulation_mode", "true", "Response", "Enforce safe simulation for automated defense"),
            ("risk_threshold_critical", "80", "Detection", "Threshold for Critical severity escalation"),
            ("risk_threshold_high", "60", "Detection", "Threshold for High severity escalation"),
        ]
        for key, val, cat, descr in defaults:
            s = SystemSetting(setting_key=key, setting_value=val, category=cat, description=descr)
            db.add(s)
        db.commit()
        settings_list = db.query(SystemSetting).all()

    return [
        {
            "id": s.id,
            "key": s.setting_key,
            "value": s.setting_value,
            "category": s.category,
            "description": s.description
        }
        for s in settings_list
    ]

@router.patch("/settings/{key}")
def update_system_setting(key: str, update: SystemSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    if not setting:
        setting = SystemSetting(setting_key=key, setting_value=update.setting_value, category="Custom")
        db.add(setting)
    else:
        setting.setting_value = update.setting_value
    db.commit()
    return {"key": key, "value": setting.setting_value}

@router.post("/backup")
def trigger_backup():
    db_path = settings.DATABASE_PATH
    if os.path.exists(db_path):
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(backup_dir, f"cybersentinel_backup_{timestamp}.db")
        shutil.copy2(db_path, backup_path)
        return {"status": "success", "backup_file": backup_path}
    return {"status": "error", "message": "Primary database file not found"}

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.name if u.role else "Viewer",
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ]

@router.post("/truncate")
def truncate_database_data(db: Session = Depends(get_db)):
    """
    Truncates all dynamic telemetry, events, incidents, containment actions, and audit logs.
    Preserves core platform infrastructure: users, roles, detection rules, threat feeds, and settings.
    """
    try:
        db.query(ApprovalRecord).delete()
        db.query(ResponseAction).delete()
        db.query(IncidentEvent).delete()
        db.query(Incident).delete()
        db.query(DetectionResult).delete()
        db.query(EventFeatures).delete()
        db.query(SecurityEvent).delete()
        db.query(AuditLog).delete()
        db.commit()

        return {
            "status": "success",
            "message": "Database truncated successfully. All sample events, telemetry, and incidents cleared.",
            "events_count": 0,
            "incidents_count": 0,
            "actions_count": 0
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to truncate database: {str(e)}")
