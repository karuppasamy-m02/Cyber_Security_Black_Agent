from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.events import SecurityEvent, DetectionRule
import json

class Layer1RuleEngine:
    """
    Layer 1: Deterministic & Rule-Based Detection
    Checks against configurable detection rules and built-in heuristic thresholds.
    """

    @classmethod
    def evaluate_event(cls, event: SecurityEvent, db: Session) -> List[str]:
        hits: List[str] = []
        rules = db.query(DetectionRule).filter(DetectionRule.is_enabled == True).all()

        payload = event.normalized_payload or {}
        raw_log = (event.raw_log or "").lower()

        for rule in rules:
            cond = rule.condition_expression or {}
            matched = False

            # Rule match by pattern
            if "pattern" in cond:
                pattern = cond["pattern"].lower()
                if pattern in raw_log or pattern in str(payload).lower():
                    matched = True

            # Rule match by threshold
            if "field" in cond and "operator" in cond and "value" in cond:
                field_val = payload.get(cond["field"])
                op = cond["operator"]
                target_val = cond["value"]

                if field_val is not None:
                    try:
                        if op == ">=" and float(field_val) >= float(target_val):
                            matched = True
                        elif op == ">" and float(field_val) > float(target_val):
                            matched = True
                        elif op == "==" and str(field_val) == str(target_val):
                            matched = True
                    except (ValueError, TypeError):
                        pass

            if matched:
                hits.append(f"{rule.name} [{rule.severity}]")

        # Built-in heuristic fallbacks if no custom rules matched
        if not hits:
            if "failed password" in raw_log or "authentication failure" in raw_log or payload.get("failed_attempts", 0) >= 3:
                hits.append("Rule: Repeated Authentication Failure [High]")
            if payload.get("distinct_ports_scanned", 0) >= 10 or "port scan" in raw_log:
                hits.append("Rule: Anomalous Port Scan Activity [Medium]")
            if "sudo: 3 incorrect password attempts" in raw_log:
                hits.append("Rule: Sudo Privilege Violation [High]")
            if payload.get("bytes_out", 0) > 10_000_000:
                hits.append("Rule: Large Egress Volume Exfiltration [Critical]")

        return hits
