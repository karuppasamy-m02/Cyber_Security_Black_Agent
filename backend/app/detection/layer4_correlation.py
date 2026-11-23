from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.events import SecurityEvent
import hashlib

class Layer4EventCorrelator:
    """
    Layer 4: Event Correlation & Kill-Chain Identification
    Groups related events across entity identifiers (Source IP, Target Host, User Account)
    within sliding temporal correlation windows (15 minutes).
    Identifies multi-stage attack patterns (e.g. Discovery -> Credential Access -> Exfiltration).
    """

    @classmethod
    def get_correlation_window(cls, event: SecurityEvent, window_minutes: int = 15) -> datetime:
        ts = event.timestamp.replace(tzinfo=None) if hasattr(event.timestamp, "tzinfo") and event.timestamp.tzinfo else event.timestamp
        return ts - timedelta(minutes=window_minutes)

    @classmethod
    def correlate_event(cls, event: SecurityEvent, db: Session) -> Dict[str, Any]:
        """
        Correlates event with recent telemetry to identify attack chains.
        Returns correlation metadata including correlation_id, cluster_size, and chain_stage.
        """
        source_ip = event.source_ip or "unknown"
        target_ip = event.destination_ip or "unknown"
        window_start = cls.get_correlation_window(event, 15)

        # Generate deterministic correlation session ID for this entity cluster
        cluster_key = f"{source_ip}->{target_ip}"
        correlation_id = hashlib.sha256(cluster_key.encode()).hexdigest()[:16]

        # Query recent events matching this source IP or destination within time window
        recent_events = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.id != event.id,
                SecurityEvent.timestamp >= window_start,
                (SecurityEvent.source_ip == source_ip) | (SecurityEvent.destination_ip == target_ip)
            )
            .order_by(SecurityEvent.timestamp.desc())
            .limit(20)
            .all()
        )

        cluster_size = len(recent_events) + 1
        distinct_categories = {e.event_category for e in recent_events}
        distinct_categories.add(event.event_category)

        # Determine Multi-Stage Kill Chain Progression
        stages = []
        if any("scan" in (e.raw_log or "").lower() for e in recent_events) or event.event_category == "Network":
            stages.append("Discovery")
        if any("fail" in (e.raw_log or "").lower() for e in recent_events) or event.event_category == "Authentication":
            stages.append("Credential Access")
        if any(e.severity in ["High", "Critical"] for e in recent_events):
            stages.append("Execution / Impact")

        is_correlated_campaign = cluster_size >= 3 or len(distinct_categories) >= 2

        return {
            "correlation_id": correlation_id,
            "cluster_size": cluster_size,
            "is_campaign": is_correlated_campaign,
            "kill_chain_stages": stages if stages else ["Initial Access"],
            "related_event_ids": [e.id for e in recent_events[:5]]
        }
