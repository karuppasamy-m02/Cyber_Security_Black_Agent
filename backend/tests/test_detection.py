import pytest
import numpy as np
from app.detection.layer2_unsupervised import Layer2UnsupervisedDetector
from app.detection.layer3_supervised import Layer3SupervisedClassifier
from app.detection.layer5_risk import Layer5RiskIntelligence
from app.detection.engine import AMTIEEngine
from app.models.events import SecurityEvent
from app.database.session import SessionLocal

def test_layer2_isolation_forest_inference():
    model = Layer2UnsupervisedDetector.get_model()
    assert model is not None, "Isolation Forest model artifact must exist"
    
    # Feature extraction for normal payload: 6 baseline features
    normal_payload = {
        "failed_attempts": 0,
        "bytes_in": 1200,
        "bytes_out": 4500,
        "port_entropy": 0.1,
        "is_admin": False,
        "is_off_hours": False
    }
    feats = Layer2UnsupervisedDetector.extract_features(normal_payload, "network_traffic")
    assert feats.shape == (1, 6)

    raw_score, deviation_score = Layer2UnsupervisedDetector.evaluate(normal_payload, "network_traffic")
    assert isinstance(raw_score, float)
    assert 0.0 <= deviation_score <= 1.0

def test_layer3_xgboost_classifier_inference():
    model = Layer3SupervisedClassifier.get_model()
    assert model is not None, "XGBoost model artifact must exist"

    # Feature extraction for brute force payload: 8 features
    brute_payload = {
        "failed_attempts": 14,
        "dst_port": 22,
        "bytes_in": 350,
        "bytes_out": 180,
        "packet_count": 15,
        "duration_sec": 0.5,
        "is_root": False,
        "distinct_ports_scanned": 1
    }
    feats = Layer3SupervisedClassifier.extract_features(brute_payload, "authentication")
    assert feats.shape == (1, 8)

    pred_class, confidence = Layer3SupervisedClassifier.classify(brute_payload, "authentication")
    assert pred_class in Layer3SupervisedClassifier.CLASSES
    assert 0.0 <= confidence <= 1.0

def test_layer5_risk_intelligence_scoring():
    hits = ["Multiple Failed Logins Threshold Exceeded (Brute Force)"]
    dev_score = 0.88
    pred_class = "Brute Force"
    conf = 0.95
    corr_meta = {"repeated_attempts": 12, "temporal_window": 60, "cluster_size": 3, "is_campaign": True}

    risk_score, severity, explanation = Layer5RiskIntelligence.calculate_risk(
        layer1_hits=hits,
        layer2_anomaly_deviation=dev_score,
        layer3_class=pred_class,
        layer3_confidence=conf,
        correlation_meta=corr_meta
    )

    assert 0.0 <= risk_score <= 100.0
    assert risk_score >= 60.0  # High risk expected
    assert severity in ["High", "Critical"]
    assert "components" in explanation
    assert "rule_hits_contribution" in explanation["components"]
    assert "unsupervised_anomaly_contribution" in explanation["components"]

def test_amtie_engine_event_processing():
    db = SessionLocal()
    try:
        # Fetch any existing event from the seeded database
        event = db.query(SecurityEvent).first()
        assert event is not None, "Seeded event should exist in database"

        det_result = AMTIEEngine.process_event(event, db)
        assert det_result is not None
        assert 0.0 <= det_result.final_risk_score <= 100.0
        assert det_result.severity in ["Low", "Medium", "High", "Critical"]
        assert det_result.layer3_class in Layer3SupervisedClassifier.CLASSES
    finally:
        db.close()
