import numpy as np
import os
import joblib
from typing import Dict, Any, Tuple
from app.config import settings
import logging

logger = logging.getLogger("cybersentinel.detection.layer2")

class Layer2UnsupervisedDetector:
    """
    Layer 2: Unsupervised Anomaly Detection using Isolation Forest.
    Calculates behavioral anomaly scores and baseline deviations.
    """
    MODEL_PATH = os.path.join(settings.MODEL_ARTIFACTS_DIR, "isolation_forest.joblib")
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            if os.path.exists(cls.MODEL_PATH):
                try:
                    cls._model = joblib.load(cls.MODEL_PATH)
                except Exception as e:
                    logger.warning(f"Could not load Isolation Forest model: {e}")
        return cls._model

    @classmethod
    def extract_features(cls, payload: Dict[str, Any], event_category: str) -> np.ndarray:
        """
        Extracts 6 normalized numerical features for baseline deviation analysis:
        [failed_attempts, bytes_in, bytes_out, port_entropy, is_privileged, off_hours_flag]
        """
        failed_attempts = float(payload.get("failed_attempts", 0))
        bytes_in = float(payload.get("bytes_in", 0)) / 10000.0  # normalize
        bytes_out = float(payload.get("bytes_out", 0)) / 10000.0
        port_entropy = float(payload.get("port_entropy", 0.1))
        is_priv = 1.0 if payload.get("is_root") or payload.get("is_admin") else 0.0
        off_hours = 1.0 if payload.get("is_off_hours") else 0.0

        return np.array([[failed_attempts, bytes_in, bytes_out, port_entropy, is_priv, off_hours]])

    @classmethod
    def evaluate(cls, payload: Dict[str, Any], event_category: str) -> Tuple[float, float]:
        """
        Returns (raw_anomaly_score, normalized_anomaly_deviation_0_to_1)
        """
        features = cls.extract_features(payload, event_category)
        model = cls.get_model()

        if model is not None:
            try:
                # isolation forest decision_function: lower means more anomalous (e.g. -0.3 is very anomalous, 0.2 is normal)
                dec = float(model.decision_function(features)[0])
                # Normalize decision function to 0.0 (normal) - 1.0 (highly anomalous)
                norm_score = max(0.0, min(1.0, 0.5 - (dec * 1.5)))
                return dec, norm_score
            except Exception as e:
                logger.error(f"Inference error in Isolation Forest: {e}")

        # Statistical fallback baseline deviation if model not yet saved
        failed = features[0][0]
        egress = features[0][2]
        priv = features[0][4]
        stat_score = min(1.0, (failed * 0.15) + (egress * 0.05) + (priv * 0.2))
        return -stat_score, stat_score
