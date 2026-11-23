import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database.session import SessionLocal
from app.ml.trainer import MLTrainer
from app.models.ml_models import ModelRegistry, ModelEvaluation
import uuid

def train_and_register_all():
    print(">> Training baseline CyberSentinel AI ML models...")
    db = SessionLocal()

    try:
        # 1. Isolation Forest
        print("   [*] Training Isolation Forest Anomaly Detector...")
        res_if = MLTrainer.train_isolation_forest()
        reg_if = ModelRegistry(
            id=str(uuid.uuid4()),
            name="Isolation Forest Anomaly Detector",
            model_type="isolation_forest",
            version="v1.0.0",
            file_path=res_if["file_path"],
            status="active",
            is_active=True,
            hyperparameters_json={"n_estimators": 100, "contamination": 0.15},
            feature_names=["failed_attempts", "bytes_in", "bytes_out", "port_entropy", "is_root", "off_hours"]
        )
        db.add(reg_if)
        db.flush()

        ev_if = ModelEvaluation(
            id=str(uuid.uuid4()),
            model_id=reg_if.id,
            precision=res_if["metrics"]["precision"],
            recall=res_if["metrics"]["recall"],
            f1_score=res_if["metrics"]["f1_score"],
            roc_auc=res_if["metrics"]["roc_auc"],
            pr_auc=res_if["metrics"]["pr_auc"],
            false_positive_rate=res_if["metrics"]["false_positive_rate"],
            latency_ms=res_if["metrics"]["latency_ms"],
            evaluation_dataset="Synthetic Enterprise Baseline & Attack Telemetry"
        )
        db.add(ev_if)
        print(f"       -> Saved Isolation Forest (F1: {res_if['metrics']['f1_score']}, ROC-AUC: {res_if['metrics']['roc_auc']})")

        # 2. XGBoost Classifier
        print("   [*] Training XGBoost Multi-Class Classifier...")
        res_xgb = MLTrainer.train_xgboost()
        reg_xgb = ModelRegistry(
            id=str(uuid.uuid4()),
            name="XGBoost Attack Classifier",
            model_type="xgboost",
            version="v1.0.0",
            file_path=res_xgb["file_path"],
            status="active",
            is_active=True,
            hyperparameters_json={"n_estimators": 80, "max_depth": 5, "learning_rate": 0.1},
            feature_names=["failed_attempts", "dst_port", "bytes_in", "bytes_out", "packet_count", "duration", "is_root", "distinct_ports"]
        )
        db.add(reg_xgb)
        db.flush()

        ev_xgb = ModelEvaluation(
            id=str(uuid.uuid4()),
            model_id=reg_xgb.id,
            precision=res_xgb["metrics"]["precision"],
            recall=res_xgb["metrics"]["recall"],
            f1_score=res_xgb["metrics"]["f1_score"],
            roc_auc=res_xgb["metrics"]["roc_auc"],
            pr_auc=res_xgb["metrics"]["pr_auc"],
            false_positive_rate=res_xgb["metrics"]["false_positive_rate"],
            latency_ms=res_xgb["metrics"]["latency_ms"],
            evaluation_dataset="Synthetic Enterprise Baseline & Attack Telemetry"
        )
        db.add(ev_xgb)
        print(f"       -> Saved XGBoost Classifier (F1: {res_xgb['metrics']['f1_score']}, ROC-AUC: {res_xgb['metrics']['roc_auc']})")

        # 3. Deep Bottleneck Autoencoder
        print("   [*] Training Deep Bottleneck Autoencoder...")
        res_ae = MLTrainer.train_autoencoder()
        reg_ae = ModelRegistry(
            id=str(uuid.uuid4()),
            name="Deep Bottleneck Autoencoder",
            model_type="autoencoder",
            version="v1.0.0",
            file_path=res_ae["file_path"],
            status="active",
            is_active=True,
            hyperparameters_json={"input_dim": 8, "latent_dim": 2, "layers": [16, 4, 2, 4, 16]},
            feature_names=["failed_attempts", "dst_port", "bytes_in", "bytes_out", "packet_count", "duration", "is_root", "distinct_ports"]
        )
        db.add(reg_ae)
        db.flush()

        ev_ae = ModelEvaluation(
            id=str(uuid.uuid4()),
            model_id=reg_ae.id,
            precision=res_ae["metrics"]["precision"],
            recall=res_ae["metrics"]["recall"],
            f1_score=res_ae["metrics"]["f1_score"],
            roc_auc=res_ae["metrics"]["roc_auc"],
            pr_auc=res_ae["metrics"]["pr_auc"],
            false_positive_rate=res_ae["metrics"]["false_positive_rate"],
            latency_ms=res_ae["metrics"]["latency_ms"],
            evaluation_dataset="Synthetic Enterprise Baseline & Attack Telemetry"
        )
        db.add(ev_ae)
        print(f"       -> Saved Autoencoder (F1: {res_ae['metrics']['f1_score']}, ROC-AUC: {res_ae['metrics']['roc_auc']})")

        db.commit()
        print(">> All initial ML models successfully trained and registered in database!")

    finally:
        db.close()

if __name__ == "__main__":
    train_and_register_all()
