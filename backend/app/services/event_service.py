from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.events import SecurityEvent, EventFeatures, DetectionResult
from app.schemas.events import EventIngest
from app.services.event_normalizer import EventNormalizer
from app.detection.engine import AMTIEEngine
from app.websocket.manager import ws_manager
import uuid
import logging

logger = logging.getLogger("cybersentinel.services.events")

class EventService:
    """
    Core Ingestion and Event Life-cycle Management Service.
    """

    @classmethod
    async def ingest_single_event(cls, ingest_data: EventIngest, db: Session) -> SecurityEvent:
        print("[ingest] normalizing...", flush=True)
        normalized = EventNormalizer.normalize(
            raw_log=ingest_data.raw_log,
            source_type=ingest_data.source_type,
            initial_payload=ingest_data.normalized_payload
        )

        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        event_hash = EventNormalizer.compute_event_hash(
            raw_log=ingest_data.raw_log,
            timestamp_str=now_utc.isoformat(),
            source_ip=normalized.get("source_ip", "0.0.0.0")
        )

        # Check for exact duplicate event hash within recent window
        existing = db.query(SecurityEvent).filter(SecurityEvent.event_hash == event_hash).first()
        if existing:
            return existing

        print("[ingest] adding SecurityEvent...", flush=True)
        event = SecurityEvent(
            id=str(uuid.uuid4()),
            event_hash=event_hash,
            source_type=normalized.get("source_type", ingest_data.source_type),
            source_ip=normalized.get("source_ip") or ingest_data.source_ip,
            destination_ip=normalized.get("destination_ip") or ingest_data.destination_ip,
            source_port=normalized.get("source_port") or ingest_data.source_port,
            destination_port=normalized.get("destination_port") or ingest_data.destination_port,
            protocol=normalized.get("protocol", "TCP"),
            event_category=normalized.get("event_category", ingest_data.event_category),
            severity=ingest_data.severity or normalized.get("severity", "Low"),
            timestamp=now_utc,
            raw_log=ingest_data.raw_log,
            normalized_payload=normalized,
            is_simulated=ingest_data.is_simulated or False
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        print("[ingest] adding EventFeatures...", flush=True)
        features = EventFeatures(
            id=str(uuid.uuid4()),
            event_id=event.id,
            extracted_features_json={
                "failed_attempts": normalized.get("failed_attempts", 0),
                "bytes_in": normalized.get("bytes_in", 0),
                "bytes_out": normalized.get("bytes_out", 0),
                "dst_port": normalized.get("destination_port", 80),
                "is_root": normalized.get("is_root", False),
                "distinct_ports": normalized.get("distinct_ports_scanned", 1)
            }
        )
        db.add(features)
        db.commit()

        print("[ingest] processing AMTIEEngine...", flush=True)
        detection_result = AMTIEEngine.process_event(event, db)
        print("[ingest] AMTIEEngine complete! Risk:", detection_result.final_risk_score, flush=True)

        # Broadcast live event over WebSocket
        try:
            broadcast_payload = {
                "type": "NEW_SECURITY_EVENT",
                "event": {
                    "id": event.id,
                    "timestamp": event.timestamp.isoformat(),
                    "source_ip": event.source_ip,
                    "destination_ip": event.destination_ip,
                    "category": event.event_category,
                    "severity": event.severity,
                    "raw_log": event.raw_log,
                    "risk_score": detection_result.final_risk_score,
                    "attack_class": detection_result.layer3_class,
                    "is_simulated": event.is_simulated
                }
            }
            await ws_manager.broadcast_event(broadcast_payload)
        except Exception as e:
            logger.warning(f"Could not broadcast event: {e}")

        return event

    @classmethod
    async def ingest_batch(cls, batch: List[EventIngest], db: Session) -> List[SecurityEvent]:
        processed = []
        for item in batch:
            evt = await cls.ingest_single_event(item, db)
            processed.append(evt)
        return processed
