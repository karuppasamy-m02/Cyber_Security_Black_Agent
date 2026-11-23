from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.events import SecurityEvent, DetectionResult
from app.models.incidents import Incident, IncidentEvent
from app.detection.layer1_rules import Layer1RuleEngine
from app.detection.layer2_unsupervised import Layer2UnsupervisedDetector
from app.detection.layer3_supervised import Layer3SupervisedClassifier
from app.detection.layer4_correlation import Layer4EventCorrelator
from app.detection.layer5_risk import Layer5RiskIntelligence
import uuid
import datetime
import logging

logger = logging.getLogger("cybersentinel.detection.amtie")

class AMTIEEngine:
    """
    Adaptive Multi-Layer Threat Intelligence Engine (AMTIE)
    Coordinates Layers 1 through 5 for complete event analysis and automated incident generation.
    """

    @classmethod
    def process_event(cls, event: SecurityEvent, db: Session) -> DetectionResult:
        payload = event.normalized_payload or {}
        cat = event.event_category

        # Layer 1: Rule-Based Evaluation
        layer1_hits = Layer1RuleEngine.evaluate_event(event, db)

        # Layer 2: Unsupervised Anomaly Detection
        raw_anomaly, norm_deviation = Layer2UnsupervisedDetector.evaluate(payload, cat)

        # Layer 3: Supervised Classification
        pred_class, confidence = Layer3SupervisedClassifier.classify(payload, cat)

        # Layer 4: Event Correlation
        corr_meta = Layer4EventCorrelator.correlate_event(event, db)

        # Layer 5: Risk Intelligence
        risk_score, severity, explanation = Layer5RiskIntelligence.calculate_risk(
            layer1_hits=layer1_hits,
            layer2_anomaly_deviation=norm_deviation,
            layer3_class=pred_class,
            layer3_confidence=confidence,
            correlation_meta=corr_meta
        )

        # Update event severity with AMTIE calculated severity
        event.severity = severity

        # Persist or update DetectionResult
        det_result = db.query(DetectionResult).filter(DetectionResult.event_id == event.id).first()
        if not det_result:
            det_result = DetectionResult(
                id=str(uuid.uuid4()),
                event_id=event.id,
                layer1_rule_hits=layer1_hits,
                layer2_anomaly_score=round(raw_anomaly, 4),
                layer3_class=pred_class,
                layer3_confidence=round(confidence, 4),
                layer4_correlation_id=corr_meta.get("correlation_id"),
                final_risk_score=risk_score,
                severity=severity,
                explanation_json=explanation
            )
            db.add(det_result)
        else:
            det_result.layer1_rule_hits = layer1_hits
            det_result.layer2_anomaly_score = round(raw_anomaly, 4)
            det_result.layer3_class = pred_class
            det_result.layer3_confidence = round(confidence, 4)
            det_result.layer4_correlation_id = corr_meta.get("correlation_id")
            det_result.final_risk_score = risk_score
            det_result.severity = severity
            det_result.explanation_json = explanation

        db.commit()
        db.refresh(det_result)

        # Auto-create incident if risk_score >= 60.0 (High/Critical)
        if risk_score >= 60.0:
            cls.auto_escalate_incident(event, det_result, corr_meta, db)

        return det_result

    @classmethod
    def auto_escalate_incident(
        cls,
        event: SecurityEvent,
        detection: DetectionResult,
        corr_meta: Dict[str, Any],
        db: Session
    ):
        """
        Automatically raises a managed Incident if a critical correlated threat is confirmed.
        """
        # Check if an active incident already exists for this correlation_id or affected entity
        corr_id = detection.layer4_correlation_id
        existing_incident = (
            db.query(Incident)
            .filter(
                Incident.status.in_(["New", "Investigating"]),
                or_(
                    Incident.description.contains(corr_id),
                    Incident.affected_asset == (event.destination_ip or event.source_ip)
                )
            )
            .first()
        )

        if existing_incident:
            # Associate event with existing incident if not already linked
            is_linked = db.query(IncidentEvent).filter(
                IncidentEvent.incident_id == existing_incident.id,
                IncidentEvent.event_id == event.id
            ).first()
            if not is_linked:
                link = IncidentEvent(
                    id=str(uuid.uuid4()),
                    incident_id=existing_incident.id,
                    event_id=event.id
                )
                db.add(link)
                # Escalate severity if incoming event is higher
                if detection.severity == "Critical" and existing_incident.severity != "Critical":
                    existing_incident.severity = "Critical"
                db.commit()
        else:
            # Create new incident
            current_year = datetime.datetime.now().year
            count = db.query(Incident).count() + 1
            code = f"INC-{current_year}-{count:04d}"

            incident = Incident(
                id=str(uuid.uuid4()),
                incident_code=code,
                title=f"{detection.layer3_class or 'Threat'} Activity Detected against {event.destination_ip or event.source_ip}",
                description=(
                    f"Automated incident generated by AMTIE Engine for correlated cluster [{corr_id}]. "
                    f"Risk score: {detection.final_risk_score}/100. Kill-chain stages: {', '.join(corr_meta.get('kill_chain_stages', []))}."
                ),
                severity=detection.severity,
                status="New",
                affected_asset=event.destination_ip or event.source_ip,
                mitre_tactics=corr_meta.get("kill_chain_stages", ["Initial Access"])
            )
            db.add(incident)
            db.flush()

            link = IncidentEvent(
                id=str(uuid.uuid4()),
                incident_id=incident.id,
                event_id=event.id
            )
            db.add(link)
            db.commit()
            logger.info(f"Auto-escalated Incident {code} (Risk: {detection.final_risk_score})")
