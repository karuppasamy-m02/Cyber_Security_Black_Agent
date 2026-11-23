import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_code = Column(String(30), unique=True, nullable=False, index=True)  # e.g., INC-2026-0042
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="Medium", index=True)  # Low, Medium, High, Critical
    status = Column(String(30), nullable=False, default="New", index=True)  # New, Investigating, Contained, Resolved, False Positive
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    affected_asset = Column(String(100), nullable=True)
    mitre_tactics = Column(JSON, default=list)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assigned_to = relationship("User", back_populates="assigned_incidents")
    incident_events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    response_actions = relationship("ResponseAction", back_populates="incident", cascade="all, delete-orphan")

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("security_events.id"), nullable=False, index=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident = relationship("Incident", back_populates="incident_events")
    event = relationship("SecurityEvent", back_populates="incident_associations")
