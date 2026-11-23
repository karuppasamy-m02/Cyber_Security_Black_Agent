import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class ThreatSource(Base):
    __tablename__ = "threat_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    url = Column(String(255), nullable=True)
    is_local = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    last_sync = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    indicators = relationship("ThreatIndicator", back_populates="source", cascade="all, delete-orphan")

class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator_type = Column(String(20), nullable=False, index=True)  # ip, domain, md5, sha256, url
    indicator_value = Column(String(255), nullable=False, index=True)
    threat_score = Column(Float, default=75.0)  # 0 to 100
    malware_family = Column(String(100), nullable=True)
    mitre_technique = Column(String(50), nullable=True)  # e.g., T1110, T1046
    description = Column(Text, nullable=True)
    confidence = Column(String(20), default="High")  # Low, Medium, High
    source_id = Column(String(36), ForeignKey("threat_sources.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source = relationship("ThreatSource", back_populates="indicators")
