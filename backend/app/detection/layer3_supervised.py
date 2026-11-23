import numpy as np
import os
import joblib
from typing import Dict, Any, Tuple
from app.config import settings
import logging

logger = logging.getLogger("cybersentinel.detection.layer3")

class Layer3SupervisedClassifier:
    """
    Layer 3: Supervised Multi-Class Attack Classifier (XGBoost / Gradient Boosted Trees).
    Predicts attack category and confidence:
    Classes: Benign, Brute Force, Port Scan, Privilege Escalation, Data Exfiltration
    """
    CLASSES = ["Benign", "Brute Force", "Port Scan", "Privilege Escalation", "Data Exfiltration"]
    MODEL_PATH = os.path.join(settings.MODEL_ARTIFACTS_DIR, "xgboost_classifier.joblib")
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            if os.path.exists(cls.MODEL_PATH):
                try:
                    cls._model = joblib.load(cls.MODEL_PATH)
                except Exception as e:
                    logger.warning(f"Could not load XGBoost model: {e}")
        return cls._model

    @classmethod
    def extract_features(cls, payload: Dict[str, Any], event_category: str) -> np.ndarray:
        failed_attempts = float(payload.get("failed_attempts", 0))
        dst_port = float(payload.get("dst_port", 80))
        bytes_in = float(payload.get("bytes_in", 0)) / 1000.0
        bytes_out = float(payload.get("bytes_out", 0)) / 1000.0
        packet_count = float(payload.get("packet_count", 1))
        duration = float(payload.get("duration_sec", 1))
        is_root = 1.0 if payload.get("is_root") else 0.0
        distinct_ports = float(payload.get("distinct_ports_scanned", 1))

        return np.array([[failed_attempts, dst_port, bytes_in, bytes_out, packet_count, duration, is_root, distinct_ports]])

    @classmethod
    def classify(cls, payload: Dict[str, Any], event_category: str) -> Tuple[str, float]:
        """
        Returns (predicted_class, confidence_score_0_to_1)
        """
        features = cls.extract_features(payload, event_category)
        model = cls.get_model()

        if model is not None:
            try:
                probs = model.predict_proba(features)[0]
                pred_idx = int(np.argmax(probs))
                confidence = float(probs[pred_idx])
                return cls.CLASSES[pred_idx], confidence
            except Exception as e:
                logger.error(f"Inference error in XGBoost classifier: {e}")

        # Deterministic feature-based expert heuristic classification fallback
        failed = payload.get("failed_attempts", 0)
        ports = payload.get("distinct_ports_scanned", 1)
        bytes_out = payload.get("bytes_out", 0)
        is_root = payload.get("is_root", False)

        if failed >= 4:
            return "Brute Force", 0.94
        elif ports >= 8:
            return "Port Scan", 0.91
        elif bytes_out > 5_000_000:
            return "Data Exfiltration", 0.88
        elif is_root and "sudo" in str(payload).lower():
            return "Privilege Escalation", 0.86
        else:
            return "Benign", 0.96
