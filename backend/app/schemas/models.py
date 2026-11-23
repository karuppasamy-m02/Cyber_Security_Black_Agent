from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ModelTrainRequest(BaseModel):
    model_type: str = "autoencoder"  # isolation_forest, xgboost, autoencoder
    epochs: Optional[int] = 50
    batch_size: Optional[int] = 32
    learning_rate: Optional[float] = 0.001
    contamination: Optional[float] = 0.05

class ModelRegistryResponse(BaseModel):
    id: str
    name: str
    model_type: str
    version: str
    file_path: str
    status: str
    is_active: bool
    hyperparameters_json: Dict[str, Any]
    feature_names: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ModelEvaluationResponse(BaseModel):
    id: str
    model_id: str
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    false_positive_rate: Optional[float] = None
    latency_ms: Optional[float] = None
    evaluation_dataset: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ModelMetricsResponse(BaseModel):
    active_models: List[ModelRegistryResponse]
    evaluations: List[ModelEvaluationResponse]
    drift_score: float = 0.02
    training_status: str = "Idle"
