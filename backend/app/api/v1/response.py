from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any
import uuid

from app.database.session import get_db
from app.models.response import ResponseAction, ApprovalRecord
from app.models.incidents import Incident
from app.models.system import AuditLog
from app.schemas.response import ActionCreate, ActionDecision, ResponseActionResponse
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/response", tags=["Response & Automation Center"])

@router.get("/actions", response_model=List[ResponseActionResponse])
def list_actions(db: Session = Depends(get_db)):
    actions = db.query(ResponseAction).order_by(ResponseAction.created_at.desc()).all()
    res = []
    for a in actions:
        approvals_data = [
            {
                "id": app.id,
                "approver_id": app.approved_by_id,
                "status": app.status,
                "reason": app.decision_reason,
                "timestamp": app.timestamp.isoformat()
            }
            for app in a.approvals
        ]
        res.append(ResponseActionResponse(
            id=a.id,
            incident_id=a.incident_id,
            action_type=a.action_type,
            target_entity=a.target_entity,
            parameters_json=a.parameters_json or {},
            status=a.status,
            recommended_by=a.recommended_by,
            rollback_instructions=a.rollback_instructions,
            created_at=a.created_at,
            approvals=approvals_data
        ))
    return res

@router.post("/actions", response_model=ResponseActionResponse)
def create_action(
    action_in: ActionCreate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    action = ResponseAction(
        id=str(uuid.uuid4()),
        incident_id=action_in.incident_id,
        action_type=action_in.action_type,
        target_entity=action_in.target_entity,
        parameters_json=action_in.parameters_json or {},
        status="pending_approval",
        recommended_by="Security Analyst",
        rollback_instructions=action_in.rollback_instructions or f"Reverse {action_in.action_type} for entity {action_in.target_entity}"
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    audit = AuditLog(
        actor_id=user_payload.get("user_id"),
        actor_username=user_payload.get("sub"),
        action_category="RESPONSE",
        action_details=f"Created pending defense action '{action.action_type}' targeting {action.target_entity}"
    )
    db.add(audit)
    db.commit()

    return ResponseActionResponse(
        id=action.id,
        incident_id=action.incident_id,
        action_type=action.action_type,
        target_entity=action.target_entity,
        parameters_json=action.parameters_json or {},
        status=action.status,
        recommended_by=action.recommended_by,
        rollback_instructions=action.rollback_instructions,
        created_at=action.created_at,
        approvals=[]
    )

@router.post("/actions/{action_id}/approve")
def approve_action(
    action_id: str,
    decision: ActionDecision,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    action = db.query(ResponseAction).filter(ResponseAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    user_id = user_payload.get("user_id")
    username = user_payload.get("sub")

    action.status = "executed"  # Safe simulation mode executed

    approval = ApprovalRecord(
        id=str(uuid.uuid4()),
        action_id=action.id,
        approved_by_id=user_id,
        status="approved",
        decision_reason=decision.reason or "Approved by SOC Lead for immediate containment."
    )
    db.add(approval)

    audit = AuditLog(
        actor_id=user_id,
        actor_username=username,
        action_category="RESPONSE",
        action_details=f"Approved and simulated execution of '{action.action_type}' targeting {action.target_entity}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Action '{action.action_type}' approved and safely executed in simulation mode."}

@router.post("/actions/{action_id}/reject")
def reject_action(
    action_id: str,
    decision: ActionDecision,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    action = db.query(ResponseAction).filter(ResponseAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    user_id = user_payload.get("user_id")
    username = user_payload.get("sub")

    action.status = "rejected"

    approval = ApprovalRecord(
        id=str(uuid.uuid4()),
        action_id=action.id,
        approved_by_id=user_id,
        status="rejected",
        decision_reason=decision.reason or "Rejected by analyst."
    )
    db.add(approval)

    audit = AuditLog(
        actor_id=user_id,
        actor_username=username,
        action_category="RESPONSE",
        action_details=f"Rejected action '{action.action_type}' targeting {action.target_entity}"
    )
    db.add(audit)
    db.commit()

    return {"message": "Action rejected."}

@router.post("/actions/{action_id}/rollback")
def rollback_action(
    action_id: str,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload)
):
    action = db.query(ResponseAction).filter(ResponseAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    action.status = "rolled_back"
    audit = AuditLog(
        actor_id=user_payload.get("user_id"),
        actor_username=user_payload.get("sub"),
        action_category="RESPONSE",
        action_details=f"Rolled back action '{action.action_type}' for {action.target_entity}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Action {action.action_type} successfully rolled back."}
