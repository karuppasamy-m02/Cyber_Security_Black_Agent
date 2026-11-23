from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from app.database.session import get_db
from app.models.ml_models import ModelRegistry, ModelEvaluation, ModelTrainingJob
from app.schemas.models import ModelTrainRequest, ModelRegistryResponse, ModelEvaluationResponse, ModelMetricsResponse
from app.ml.trainer import MLTrainer

router = APIRouter(prefix="/models", tags=["Model Management & ML Lab"])

@router.get("", response_model=List[ModelRegistryResponse])
def list_models(db: Session = Depends(get_db)):
    models = db.query(ModelRegistry).order_by(ModelRegistry.created_at.desc()).all()
    return models

@router.post("/train")
def train_model(train_req: ModelTrainRequest, db: Session = Depends(get_db)):
    model_type = train_req.model_type.lower()
    
    if model_type == "autoencoder":
        res = MLTrainer.train_autoencoder()
        name = "Deep Bottleneck Autoencoder"
        version = f"v{db.query(ModelRegistry).filter(ModelRegistry.model_type == 'autoencoder').count() + 1}.0.0"
    elif model_type == "xgboost":
        res = MLTrainer.train_xgboost()
        name = "XGBoost Multi-Class Classifier"
        version = f"v{db.query(ModelRegistry).filter(ModelRegistry.model_type == 'xgboost').count() + 1}.0.0"
    elif model_type == "isolation_forest":
        res = MLTrainer.train_isolation_forest()
        name = "Isolation Forest Unsupervised"
        version = f"v{db.query(ModelRegistry).filter(ModelRegistry.model_type == 'isolation_forest').count() + 1}.0.0"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model type: {model_type}")

    # Register in ModelRegistry
    reg = ModelRegistry(
        id=str(uuid.uuid4()),
        name=name,
        model_type=model_type,
        version=version,
        file_path=res["file_path"],
        status="active",
        is_active=True,
        hyperparameters_json=train_req.dict(),
        feature_names=["failed_attempts", "dst_port", "bytes_in", "bytes_out", "packet_count", "duration", "is_root", "distinct_ports"]
    )
    db.add(reg)
    db.flush()

    # Save Evaluation
    metrics = res["metrics"]
    ev = ModelEvaluation(
        id=str(uuid.uuid4()),
        model_id=reg.id,
        precision=metrics.get("precision"),
        recall=metrics.get("recall"),
        f1_score=metrics.get("f1_score"),
        roc_auc=metrics.get("roc_auc"),
        pr_auc=metrics.get("pr_auc"),
        false_positive_rate=metrics.get("false_positive_rate"),
        latency_ms=metrics.get("latency_ms"),
        evaluation_dataset="Synthetic Enterprise Baseline & Attack Telemetry"
    )
    db.add(ev)
    db.commit()

    return {
        "status": "success",
        "model_id": reg.id,
        "name": reg.name,
        "version": reg.version,
        "metrics": metrics
    }

@router.get("/evaluations", response_model=List[ModelEvaluationResponse])
def list_evaluations(db: Session = Depends(get_db)):
    evals = db.query(ModelEvaluation).order_by(ModelEvaluation.created_at.desc()).all()
    return evals

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_metrics_overview(db: Session = Depends(get_db)):
    active = db.query(ModelRegistry).filter(ModelRegistry.is_active == True).all()
    evals = db.query(ModelEvaluation).order_by(ModelEvaluation.created_at.desc()).limit(10).all()
    return ModelMetricsResponse(
        active_models=active,
        evaluations=evals,
        drift_score=0.018,
        training_status="Idle"
    )

@router.post("/{model_id}/activate")
def activate_model(model_id: str, db: Session = Depends(get_db)):
    model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Deactivate other models of same type
    db.query(ModelRegistry).filter(ModelRegistry.model_type == model.model_type).update({"is_active": False})
    model.is_active = True
    db.commit()
    return {"message": f"Model {model.name} {model.version} is now the primary active model"}
