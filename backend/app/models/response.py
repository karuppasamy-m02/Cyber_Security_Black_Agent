import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=True)
    action_type = Column(String(50), nullable=False)  # isolate_host, block_ip, revoke_session, reset_password, custom_rule
    target_entity = Column(String(100), nullable=False)  # e.g. IP 192.168.1.50 or user admin_test
    parameters_json = Column(JSON, default=dict)
    status = Column(String(30), nullable=False, default="pending_approval")  # pending_approval, approved, executed, rejected, rolled_back
    recommended_by = Column(String(50), default="AI Analyst")
    rollback_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident = relationship("Incident", back_populates="response_actions")
    approvals = relationship("ApprovalRecord", back_populates="action", cascade="all, delete-orphan")

class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action_id = Column(String(36), ForeignKey("response_actions.id"), nullable=False)
    approved_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False)  # approved, rejected
    decision_reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    action = relationship("ResponseAction", back_populates="approvals")
