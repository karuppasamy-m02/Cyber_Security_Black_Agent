from typing import List, Dict, Any, Tuple

class Layer5RiskIntelligence:
    """
    Layer 5: Multi-Signal Risk Intelligence Scorer
    Combines outputs from Layer 1 (Rules), Layer 2 (Unsupervised Anomaly),
    Layer 3 (Supervised Classifier), and Layer 4 (Event Correlation).
    
    CRITICAL: Avoids double-counting correlated evidence.
    Generates a calibrated 0 to 100 Risk Score and explains each component.
    """

    @classmethod
    def calculate_risk(
        cls,
        layer1_hits: List[str],
        layer2_anomaly_deviation: float,  # 0.0 to 1.0
        layer3_class: str,
        layer3_confidence: float,        # 0.0 to 1.0
        correlation_meta: Dict[str, Any]
    ) -> Tuple[float, str, Dict[str, Any]]:
        """
        Returns (risk_score_0_to_100, severity_label, explanation_dict)
        """
        # Base weight allocations (Sub-signals)
        # 1. Rule component: 0 to 35 pts
        rule_score = 0.0
        if layer1_hits:
            if any("Critical" in h for h in layer1_hits):
                rule_score = 35.0
            elif any("High" in h for h in layer1_hits):
                rule_score = 28.0
            elif any("Medium" in h for h in layer1_hits):
                rule_score = 18.0
            else:
                rule_score = 10.0

        # 2. Unsupervised Anomaly component: 0 to 25 pts (bounded by baseline deviation)
        anomaly_score = float(layer2_anomaly_deviation * 25.0)

        # 3. Supervised Classification component: 0 to 30 pts
        class_score = 0.0
        if layer3_class != "Benign":
            severity_mult = {
                "Data Exfiltration": 1.0,
                "Privilege Escalation": 0.95,
                "Brute Force": 0.85,
                "Port Scan": 0.65
            }.get(layer3_class, 0.7)
            class_score = float(layer3_confidence * 30.0 * severity_mult)

        # 4. Correlation multiplier (avoiding double-counting: only amplifies multi-stage clusters)
        correlation_bonus = 0.0
        cluster_size = correlation_meta.get("cluster_size", 1)
        is_campaign = correlation_meta.get("is_campaign", False)
        if is_campaign:
            correlation_bonus = min(15.0, (cluster_size - 1) * 3.0)

        # Raw combined score (capped at 100)
        raw_score = rule_score + anomaly_score + class_score + correlation_bonus
        final_risk_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Assign calibrated severity
        if final_risk_score >= 80.0:
            severity = "Critical"
        elif final_risk_score >= 60.0:
            severity = "High"
        elif final_risk_score >= 35.0:
            severity = "Medium"
        else:
            severity = "Low"

        # Explainable breakdown for analysts
        explanation = {
            "final_risk_score": final_risk_score,
            "severity": severity,
            "components": {
                "rule_hits_contribution": round(rule_score, 1),
                "unsupervised_anomaly_contribution": round(anomaly_score, 1),
                "supervised_classifier_contribution": round(class_score, 1),
                "kill_chain_correlation_bonus": round(correlation_bonus, 1)
            },
            "primary_factors": [
                f"Rule hits: {', '.join(layer1_hits) if layer1_hits else 'None'}",
                f"Anomaly baseline deviation: {round(layer2_anomaly_deviation * 100, 1)}%",
                f"Classified as '{layer3_class}' with {round(layer3_confidence * 100, 1)}% confidence",
                f"Correlated cluster activity: {cluster_size} events linked in 15min window"
            ]
        }

        return final_risk_score, severity, explanation
