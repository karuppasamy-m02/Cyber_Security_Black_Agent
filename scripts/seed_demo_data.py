import sys
import os
import uuid
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database.session import SessionLocal
from app.models.events import SecurityEvent, EventFeatures
from app.services.event_normalizer import EventNormalizer
from app.detection.engine import AMTIEEngine

def seed_demo_telemetry():
    print(">> Seeding realistic cybersecurity demonstration telemetry...", flush=True)
    db = SessionLocal()

    try:
        events_data = [
            # 1. SSH Brute Force Campaign against Domain Controller
            {
                "source_type": "linux_auth",
                "source_ip": "185.220.101.5",
                "destination_ip": "10.0.0.10",
                "source_port": 49210,
                "destination_port": 22,
                "protocol": "TCP",
                "event_category": "Authentication",
                "severity": "High",
                "raw_log": "Failed password for invalid user root from 185.220.101.5 port 49210 ssh2 (Attempt 1 of 8)",
                "normalized_payload": {"failed_attempts": 6, "is_root": True, "target_user": "root"}
            },
            {
                "source_type": "linux_auth",
                "source_ip": "185.220.101.5",
                "destination_ip": "10.0.0.10",
                "source_port": 49212,
                "destination_port": 22,
                "protocol": "TCP",
                "event_category": "Authentication",
                "severity": "High",
                "raw_log": "Failed password for invalid user admin from 185.220.101.5 port 49212 ssh2 (Attempt 2 of 8)",
                "normalized_payload": {"failed_attempts": 7, "is_root": True, "target_user": "admin"}
            },
            {
                "source_type": "linux_auth",
                "source_ip": "185.220.101.5",
                "destination_ip": "10.0.0.10",
                "source_port": 49215,
                "destination_port": 22,
                "protocol": "TCP",
                "event_category": "Authentication",
                "severity": "Critical",
                "raw_log": "Failed password for invalid user administrator from 185.220.101.5 port 49215 ssh2 (Attempt 3 of 8)",
                "normalized_payload": {"failed_attempts": 9, "is_root": True, "target_user": "administrator"}
            },

            # 2. Port Reconnaissance Scan against DB Server
            {
                "source_type": "network_flow",
                "source_ip": "45.154.255.89",
                "destination_ip": "10.0.0.25",
                "source_port": 58102,
                "destination_port": 1433,
                "protocol": "TCP",
                "event_category": "Network",
                "severity": "Medium",
                "raw_log": "SYN_SENT sweep across ports 1433, 3306, 5432, 1521, 27017 from 45.154.255.89",
                "normalized_payload": {"distinct_ports_scanned": 18, "bytes_out": 240, "bytes_in": 120}
            },
            {
                "source_type": "network_flow",
                "source_ip": "45.154.255.89",
                "destination_ip": "10.0.0.25",
                "source_port": 58104,
                "destination_port": 3306,
                "protocol": "TCP",
                "event_category": "Network",
                "severity": "Medium",
                "raw_log": "SYN_SENT sweep across database listener 3306 from 45.154.255.89",
                "normalized_payload": {"distinct_ports_scanned": 19, "bytes_out": 300, "bytes_in": 150}
            },

            # 3. Data Exfiltration from Web Portal to C2 Node
            {
                "source_type": "network_flow",
                "source_ip": "10.0.0.40",
                "destination_ip": "185.220.101.5",
                "source_port": 43810,
                "destination_port": 443,
                "protocol": "TCP",
                "event_category": "Network",
                "severity": "Critical",
                "raw_log": "FLOW 10.0.0.40:43810 -> 185.220.101.5:443 PROTO=TCP BYTES_OUT=24800000 BYTES_IN=4096",
                "normalized_payload": {"bytes_out": 24800000, "bytes_in": 4096, "duration_sec": 180}
            },

            # 4. Sudo Abuse / Privilege Escalation on Finance Workstation
            {
                "source_type": "linux_auth",
                "source_ip": "10.0.1.105",
                "destination_ip": "10.0.1.105",
                "source_port": 1024,
                "destination_port": 22,
                "protocol": "TCP",
                "event_category": "Privilege",
                "severity": "High",
                "raw_log": "sudo: 3 incorrect password attempts ; TTY=pts/2 ; PWD=/home/finance_user ; USER=root ; COMMAND=/bin/bash",
                "normalized_payload": {"is_root": True, "failed_attempts": 3, "command": "/bin/bash"}
            },

            # 5. Normal Benign Telemetry Events
            {
                "source_type": "json",
                "source_ip": "10.0.1.55",
                "destination_ip": "10.0.0.40",
                "source_port": 52341,
                "destination_port": 443,
                "protocol": "TCP",
                "event_category": "Authentication",
                "severity": "Low",
                "raw_log": "User 'alice_chen' successfully authenticated via Okta SSO to E-Commerce Portal",
                "normalized_payload": {"status": "SUCCESS", "user": "alice_chen", "failed_attempts": 0}
            },
            {
                "source_type": "windows_event",
                "source_ip": "10.0.1.80",
                "destination_ip": "10.0.0.10",
                "source_port": 50122,
                "destination_port": 445,
                "protocol": "TCP",
                "event_category": "Authentication",
                "severity": "Low",
                "raw_log": "EventID: 4624 An account was successfully logged on. Account Name: bob_williams, Logon Type: 3",
                "normalized_payload": {"event_id": 4624, "status": "LOGON_SUCCESS", "failed_attempts": 0}
            },
            {
                "source_type": "network_flow",
                "source_ip": "10.0.1.92",
                "destination_ip": "10.0.0.40",
                "source_port": 54120,
                "destination_port": 443,
                "protocol": "TCP",
                "event_category": "Network",
                "severity": "Low",
                "raw_log": "FLOW 10.0.1.92:54120 -> 10.0.0.40:443 PROTO=TCP BYTES_OUT=1240 BYTES_IN=34500",
                "normalized_payload": {"bytes_out": 1240, "bytes_in": 34500, "duration_sec": 5}
            }
        ]

        count = 0
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

        for item in events_data:
            normalized = EventNormalizer.normalize(
                raw_log=item["raw_log"],
                source_type=item["source_type"],
                initial_payload=item.get("normalized_payload")
            )
            event_hash = EventNormalizer.compute_event_hash(
                raw_log=item["raw_log"],
                timestamp_str=now_utc.isoformat(),
                source_ip=normalized.get("source_ip", "0.0.0.0")
            )

            # Skip if already in DB
            existing = db.query(SecurityEvent).filter(SecurityEvent.event_hash == event_hash).first()
            if existing:
                continue

            event = SecurityEvent(
                id=str(uuid.uuid4()),
                event_hash=event_hash,
                source_type=normalized.get("source_type", item["source_type"]),
                source_ip=normalized.get("source_ip"),
                destination_ip=normalized.get("destination_ip"),
                source_port=normalized.get("source_port"),
                destination_port=normalized.get("destination_port"),
                protocol=normalized.get("protocol", "TCP"),
                event_category=normalized.get("event_category", item["event_category"]),
                severity=item.get("severity", "Low"),
                timestamp=now_utc,
                raw_log=item["raw_log"],
                normalized_payload=normalized,
                is_simulated=True
            )
            db.add(event)
            db.commit()
            db.refresh(event)

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

            # Run AMTIE detection pipeline
            det_result = AMTIEEngine.process_event(event, db)
            count += 1
            print(f"   [+] Seeded event {count}: {event.event_category} ({det_result.severity}, Risk: {det_result.final_risk_score})", flush=True)

        print(f">> Successfully seeded {count} events through full AMTIE engine!", flush=True)

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_telemetry()
