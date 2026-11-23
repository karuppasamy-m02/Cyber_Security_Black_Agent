import numpy as np
import os
import joblib
import time
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from xgboost import XGBClassifier
from app.config import settings
from app.ml.autoencoder import AutoencoderModel
from app.ml.metrics import MLEvaluator
import logging

logger = logging.getLogger("cybersentinel.ml.trainer")

class MLTrainer:
    """
    Orchestrates training, evaluation, and serialization of CyberSentinel ML models.
    """

    @classmethod
    def generate_synthetic_telemetry(cls, n_samples: int = 1500) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates realistic synthetic cybersecurity baseline & attack telemetry for initial model training.
        Features (8 dims):
        [failed_attempts, dst_port, bytes_in_kb, bytes_out_kb, packet_count, duration_s, is_root, distinct_ports]
        """
        np.random.seed(42)
        n_benign = int(n_samples * 0.8)
        n_attack = n_samples - n_benign

        # 1. Benign traffic: low failures, standard ports (80, 443), low egress, normal duration
        benign_failed = np.random.poisson(lam=0.2, size=n_benign)
        benign_ports = np.random.choice([80, 443, 8080], size=n_benign)
        benign_bytes_in = np.random.exponential(scale=50.0, size=n_benign)
        benign_bytes_out = np.random.exponential(scale=100.0, size=n_benign)
        benign_packets = np.random.randint(5, 50, size=n_benign)
        benign_duration = np.random.exponential(scale=10.0, size=n_benign)
        benign_root = np.zeros(n_benign)
        benign_unique_ports = np.ones(n_benign)

        X_benign = np.column_stack([
            benign_failed, benign_ports, benign_bytes_in, benign_bytes_out,
            benign_packets, benign_duration, benign_root, benign_unique_ports
        ])
        y_benign = np.zeros(n_benign, dtype=int)  # 0: Benign

        # 2. Attack traffic (Brute Force, Port Scan, Exfil, Privilege Escalation)
        sub_n = n_attack // 4
        # Brute Force
        bf_failed = np.random.randint(5, 30, size=sub_n)
        bf_ports = np.random.choice([22, 3389, 445], size=sub_n)
        bf_bytes_in = np.random.uniform(5, 20, size=sub_n)
        bf_bytes_out = np.random.uniform(2, 10, size=sub_n)
        bf_packets = np.random.randint(20, 100, size=sub_n)
        bf_duration = np.random.uniform(2, 60, size=sub_n)
        bf_root = np.zeros(sub_n)
        bf_unique_ports = np.ones(sub_n)
        X_bf = np.column_stack([bf_failed, bf_ports, bf_bytes_in, bf_bytes_out, bf_packets, bf_duration, bf_root, bf_unique_ports])
        y_bf = np.full(sub_n, 1)  # 1: Brute Force

        # Port Scan
        ps_failed = np.zeros(sub_n)
        ps_ports = np.random.randint(1, 65535, size=sub_n)
        ps_bytes_in = np.random.uniform(0.1, 1, size=sub_n)
        ps_bytes_out = np.random.uniform(0.1, 1, size=sub_n)
        ps_packets = np.random.randint(50, 300, size=sub_n)
        ps_duration = np.random.uniform(1, 10, size=sub_n)
        ps_root = np.zeros(sub_n)
        ps_unique_ports = np.random.randint(15, 100, size=sub_n)
        X_ps = np.column_stack([ps_failed, ps_ports, ps_bytes_in, ps_bytes_out, ps_packets, ps_duration, ps_root, ps_unique_ports])
        y_ps = np.full(sub_n, 2)  # 2: Port Scan

        # Privilege Escalation
        pe_failed = np.random.randint(1, 4, size=sub_n)
        pe_ports = np.array([22] * sub_n)
        pe_bytes_in = np.random.uniform(10, 50, size=sub_n)
        pe_bytes_out = np.random.uniform(10, 50, size=sub_n)
        pe_packets = np.random.randint(10, 40, size=sub_n)
        pe_duration = np.random.uniform(30, 200, size=sub_n)
        pe_root = np.ones(sub_n)
        pe_unique_ports = np.ones(sub_n)
        X_pe = np.column_stack([pe_failed, pe_ports, pe_bytes_in, pe_bytes_out, pe_packets, pe_duration, pe_root, pe_unique_ports])
        y_pe = np.full(sub_n, 3)  # 3: Privilege Escalation

        # Data Exfiltration
        ex_failed = np.zeros(n_attack - (sub_n * 3))
        rem = len(ex_failed)
        ex_ports = np.random.choice([443, 8443, 9001], size=rem)
        ex_bytes_in = np.random.uniform(50, 200, size=rem)
        ex_bytes_out = np.random.uniform(10000, 50000, size=rem)  # High egress
        ex_packets = np.random.randint(500, 5000, size=rem)
        ex_duration = np.random.uniform(60, 600, size=rem)
        ex_root = np.random.choice([0, 1], size=rem)
        ex_unique_ports = np.ones(rem)
        X_ex = np.column_stack([ex_failed, ex_ports, ex_bytes_in, ex_bytes_out, ex_packets, ex_duration, ex_root, ex_unique_ports])
        y_ex = np.full(rem, 4)  # 4: Data Exfiltration

        X = np.vstack([X_benign, X_bf, X_ps, X_pe, X_ex])
        y = np.concatenate([y_benign, y_bf, y_ps, y_pe, y_ex])

        # Shuffle
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        return X[indices], y[indices]

    @classmethod
    def train_isolation_forest(cls) -> Dict[str, Any]:
        os.makedirs(settings.MODEL_ARTIFACTS_DIR, exist_ok=True)
        X, y = cls.generate_synthetic_telemetry(2000)
        # Use 6 features for isolation forest: [failed, bytes_in, bytes_out, port_entropy, is_root, off_hours]
        X_if = np.column_stack([
            X[:, 0], X[:, 2], X[:, 3], X[:, 7] / 20.0, X[:, 6], (X[:, 1] % 2)
        ])

        model = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
        start = time.time()
        model.fit(X_if)
        
        preds = model.predict(X_if)  # -1 anomaly, 1 normal
        binary_pred = np.where(preds == -1, 1, 0)
        binary_true = np.where(y != 0, 1, 0)
        scores = -model.decision_function(X_if)

        eval_metrics = MLEvaluator.evaluate_binary(binary_true, binary_pred, scores, start, len(X))

        save_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "isolation_forest.joblib")
        joblib.dump(model, save_path)

        return {
            "model_type": "isolation_forest",
            "file_path": save_path,
            "metrics": eval_metrics
        }

    @classmethod
    def train_xgboost(cls) -> Dict[str, Any]:
        os.makedirs(settings.MODEL_ARTIFACTS_DIR, exist_ok=True)
        X, y = cls.generate_synthetic_telemetry(2500)

        model = XGBClassifier(
            n_estimators=80,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric="mlogloss"
        )
        start = time.time()
        model.fit(X, y)

        preds = model.predict(X)
        probs = model.predict_proba(X)
        binary_pred = np.where(preds != 0, 1, 0)
        binary_true = np.where(y != 0, 1, 0)
        attack_probs = 1.0 - probs[:, 0]

        eval_metrics = MLEvaluator.evaluate_binary(binary_true, binary_pred, attack_probs, start, len(X))

        save_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "xgboost_classifier.joblib")
        joblib.dump(model, save_path)

        return {
            "model_type": "xgboost",
            "file_path": save_path,
            "metrics": eval_metrics
        }

    @classmethod
    def train_autoencoder(cls) -> Dict[str, Any]:
        os.makedirs(settings.MODEL_ARTIFACTS_DIR, exist_ok=True)
        X, y = cls.generate_synthetic_telemetry(2000)
        # Train on predominantly benign samples
        X_benign = X[y == 0]
        
        ae = AutoencoderModel(input_dim=8, latent_dim=2)
        start = time.time()
        loss_curve = ae.fit(X_benign)

        errors = ae.predict_reconstruction_error(X)
        binary_pred = (errors > ae.threshold).astype(int)
        binary_true = np.where(y != 0, 1, 0)

        eval_metrics = MLEvaluator.evaluate_binary(binary_true, binary_pred, errors, start, len(X))

        save_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "autoencoder_model.joblib")
        ae.save(save_path)

        return {
            "model_type": "autoencoder",
            "file_path": save_path,
            "metrics": eval_metrics,
            "loss_curve": loss_curve
        }
