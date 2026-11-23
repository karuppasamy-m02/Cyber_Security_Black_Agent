import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_hash = Column(String(64), unique=True, nullable=False, index=True)
    source_type = Column(String(50), nullable=False, index=True)  # linux_auth, windows_event, network_flow, json, manual
    source_ip = Column(String(45), nullable=True, index=True)
    destination_ip = Column(String(45), nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True, index=True)
    protocol = Column(String(20), nullable=True, default="TCP")
    event_category = Column(String(50), nullable=False, index=True)  # Authentication, Network, System, Privilege, Malware
    severity = Column(String(20), nullable=False, default="Low", index=True)  # Low, Medium, High, Critical
    timestamp = Column(DateTime, nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
    raw_log = Column(Text, nullable=False)
    normalized_payload = Column(JSON, default=dict)
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    features = relationship("EventFeatures", back_populates="event", uselist=False, cascade="all, delete-orphan")
    detection_result = relationship("DetectionResult", back_populates="event", uselist=False, cascade="all, delete-orphan")
    incident_associations = relationship("IncidentEvent", back_populates="event", cascade="all, delete-orphan")

class EventFeatures(Base):
    __tablename__ = "event_features"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("security_events.id"), nullable=False, unique=True)
    extracted_features_json = Column(JSON, default=dict)
    vector_repr = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    event = relationship("SecurityEvent", back_populates="features")

class DetectionResult(Base):
    __tablename__ = "detection_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("security_events.id"), nullable=False, unique=True)
    layer1_rule_hits = Column(JSON, default=list)  # Matched rule names/IDs
    layer2_anomaly_score = Column(Float, nullable=True)  # Isolation Forest score
    layer3_class = Column(String(50), nullable=True)  # XGBoost predicted label
    layer3_confidence = Column(Float, nullable=True)  # Model confidence 0.0-1.0
    layer4_correlation_id = Column(String(64), nullable=True, index=True)  # Correlated entity session ID
    final_risk_score = Column(Float, nullable=False, default=0.0, index=True)  # 0 to 100
    severity = Column(String(20), nullable=False, default="Low", index=True)  # Low, Medium, High, Critical
    explanation_json = Column(JSON, default=dict)  # SHAP / contributing factors
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    event = relationship("SecurityEvent", back_populates="detection_result")

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    rule_type = Column(String(50), nullable=False, default="threshold")  # threshold, pattern, sequence, blacklist
    condition_expression = Column(JSON, nullable=False)  # JSON definition of matching criteria
    severity = Column(String(20), nullable=False, default="Medium")
    is_enabled = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
