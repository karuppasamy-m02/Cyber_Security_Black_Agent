import pytest
import uuid
from datetime import datetime, timezone
from app.services.event_normalizer import EventNormalizer
from app.models.events import SecurityEvent
from app.detection.engine import AMTIEEngine
from app.database.session import SessionLocal

def test_parse_linux_auth():
    raw_linux = "May 10 12:45:01 web-server-01 sshd[14205]: Failed password for invalid user root from 192.168.1.50 port 54321 ssh2"
    norm = EventNormalizer.parse_linux_auth(raw_linux)
    assert norm["event_category"] == "Authentication"
    assert norm["source_ip"] == "192.168.1.50"
    assert norm["source_port"] == 54321
    assert norm["destination_port"] == 22
    assert norm["failed_attempts"] == 1
    assert norm["is_root"] is True

def test_parse_windows_event():
    raw_win = "EventID: 4625 An account failed to log on. Account: Administrator, Source IP: 10.0.0.45"
    norm = EventNormalizer.parse_windows_event(raw_win)
    assert norm["event_category"] == "Authentication"
    assert norm["source_ip"] == "10.0.0.45"
    assert norm["failed_attempts"] == 1
    assert norm["is_root"] is True
    assert norm["status"] == "LOGON_FAILURE"

def test_parse_network_flow():
    raw_flow = "FLOW 192.168.1.50:49210 -> 10.0.0.5:443 PROTO=TCP BYTES_OUT=15420000 BYTES_IN=2048"
    norm = EventNormalizer.parse_network_flow(raw_flow)
    assert norm["event_category"] == "Network"
    assert norm["source_ip"] == "192.168.1.50"
    assert norm["destination_ip"] == "10.0.0.5"
    assert norm["destination_port"] == 443

def test_compute_event_hash_deterministic():
    h1 = EventNormalizer.compute_event_hash("raw log test message", "2026-11-22T10:00:00", "192.168.1.1")
    h2 = EventNormalizer.compute_event_hash("raw log test message", "2026-11-22T10:00:00", "192.168.1.1")
    h3 = EventNormalizer.compute_event_hash("different log", "2026-11-22T10:00:00", "192.168.1.1")
    assert h1 == h2
    assert h1 != h3

def test_ingest_and_amtie_processing_pipeline():
    db = SessionLocal()
    try:
        rand_ip = f"10.0.3.{uuid.uuid4().int % 250 + 1}"
        raw_log = f"sshd[9999]: Failed password for root from {rand_ip} port 53100 ssh2"
        normalized = EventNormalizer.normalize(raw_log=raw_log, source_type="linux_auth")
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        event_hash = EventNormalizer.compute_event_hash(raw_log, now_utc.isoformat(), rand_ip)

        event = SecurityEvent(
            id=str(uuid.uuid4()),
            event_hash=event_hash,
            source_type="linux_auth",
            source_ip=rand_ip,
            destination_ip="10.0.1.10",
            source_port=53100,
            destination_port=22,
            protocol="TCP",
            event_category="Authentication",
            severity="Medium",
            timestamp=now_utc,
            raw_log=raw_log,
            normalized_payload=normalized,
            is_simulated=False
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Process through AMTIE 5-layer engine
        det_result = AMTIEEngine.process_event(event, db)
        assert det_result is not None
        assert 0.0 <= det_result.final_risk_score <= 100.0
        assert det_result.event_id == event.id
    finally:
        db.close()
