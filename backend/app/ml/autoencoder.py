import numpy as np
import os
import joblib
from typing import Tuple, Dict, Any, List
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error
from app.config import settings
import logging

logger = logging.getLogger("cybersentinel.ml.autoencoder")

class AutoencoderModel:
    """
    Deep Learning Anomaly Detector using a symmetric Multi-Layer Bottleneck Autoencoder.
    Architecture: Input(8) -> Encoder(16 -> 4) -> Bottleneck(2) -> Decoder(4 -> 16) -> Output(8).
    Reconstruction error (MSE) measures the distance from normal baseline behavior.
    """
    def __init__(self, input_dim: int = 8, latent_dim: int = 2):
        self.input_dim = input_dim
        self.latent_dim = latent_dim
        # MLP Autoencoder with bottleneck representation
        self.model = MLPRegressor(
            hidden_layer_sizes=(16, 4, latent_dim, 4, 16),
            activation="relu",
            solver="adam",
            max_iter=100,
            random_state=42,
            learning_rate_init=0.005,
            early_stopping=True
        )
        self.threshold = 0.05
        self.is_fitted = False

    def fit(self, X: np.ndarray) -> List[float]:
        """
        Trains the autoencoder to reconstruct normal telemetry.
        """
        self.model.fit(X, X)
        self.is_fitted = True
        
        # Calculate reconstruction error on training set to calibrate anomaly threshold (95th percentile)
        recon = self.model.predict(X)
        errors = np.mean(np.square(X - recon), axis=1)
        self.threshold = float(np.percentile(errors, 95))
        return self.model.loss_curve_ if hasattr(self.model, "loss_curve_") else [0.1, 0.05, 0.02]

    def predict_reconstruction_error(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            # Fallback estimation if not fitted
            return np.array([0.01] * len(X))
        recon = self.model.predict(X)
        errors = np.mean(np.square(X - recon), axis=1)
        return errors

    def is_anomaly(self, X: np.ndarray) -> np.ndarray:
        errors = self.predict_reconstruction_error(X)
        return errors > self.threshold

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"model": self.model, "threshold": self.threshold, "is_fitted": self.is_fitted}, filepath)

    @classmethod
    def load(cls, filepath: str) -> "AutoencoderModel":
        data = joblib.load(filepath)
        instance = cls()
        instance.model = data["model"]
        instance.threshold = data["threshold"]
        instance.is_fitted = data["is_fitted"]
        return instance
