import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hostname = Column(String(100), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False, default="Server")  # Server, Workstation, Firewall, Switch, Cloud
    criticality = Column(String(20), nullable=False, default="Medium")  # Low, Medium, High, Critical
    os = Column(String(50), nullable=True)
    department = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="Online")  # Online, Offline, Compromised, Quarantined
    meta_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
