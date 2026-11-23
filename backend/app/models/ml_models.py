import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text, JSON
from app.database.session import Base

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # isolation_forest, xgboost, autoencoder
    version = Column(String(20), nullable=False)
    file_path = Column(String(255), nullable=False)
    status = Column(String(30), default="trained")  # trained, evaluating, active, archived
    is_active = Column(Boolean, default=False)
    hyperparameters_json = Column(JSON, default=dict)
    feature_names = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(36), ForeignKey("model_registry.id"), nullable=False)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    pr_auc = Column(Float, nullable=True)
    false_positive_rate = Column(Float, nullable=True)
    latency_ms = Column(Float, nullable=True)
    evaluation_dataset = Column(String(100), nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ModelTrainingJob(Base):
    __tablename__ = "model_training_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    status = Column(String(30), default="pending")  # pending, running, completed, failed
    epoch_progress = Column(Integer, default=0)
    total_epochs = Column(Integer, default=100)
    loss = Column(Float, nullable=True)
    log_output = Column(Text, nullable=True)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
