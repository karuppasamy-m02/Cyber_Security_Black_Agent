# AMTIE: Adaptive Multi-Layer Threat Intelligence Engine

## 1. Engine Architecture & Five-Layer Pipeline

AMTIE is designed to eliminate both brittle single-indicator alerts and "black box" false positives through a 5-layer pipeline.

```
Incoming Telemetry (Normalized Event)
  │
  ├──► [Layer 1: Deterministic Rule Engine]
  │      - Configurable detection rules (threshold, regex, blacklist)
  │      - High-confidence known attack signatures (SSH Brute Force, Sudo Abuse)
  │
  ├──► [Layer 2: Unsupervised Anomaly Detection]
  │      - Scikit-learn Isolation Forest (contamination=0.03, n_estimators=150)
  │      - Analyzes baseline behavioral deviation (0.0 to 1.0)
  │
  ├──► [Layer 3: Supervised Attack Classifier]
  │      - XGBoost Multi-Class Gradient Boosted Classifier
  │      - Classes: Benign, Brute Force, Port Scan, Privilege Escalation, Data Exfiltration
  │      - Calibrated class confidence probabilities
  │
  ├──► [Layer 4: Entity & Temporal Correlation]
  │      - Sliding 15-minute correlation window
  │      - Entity clustering: Source IP -> Target IP -> User Account
  │      - MITRE ATT&CK Kill-Chain stage sequencing
  │
  └──► [Layer 5: Multi-Signal Risk Intelligence Scorer]
         - Calibrated 0 to 100 Risk Score
         - Critical Anti-Double-Counting formula
         - Automatic Incident Escalation (Score >= 70.0)
         - Explainable attribution breakdown
```

---

## 2. Feature Vector Specifications

### Layer 2 (Unsupervised Isolation Forest): 6 Features
1. `failed_attempts`: Count of recent consecutive failed authentications.
2. `bytes_in`: Normalized ingress byte volume ($/10000.0$).
3. `bytes_out`: Normalized egress byte volume ($/10000.0$).
4. `port_entropy`: Statistical dispersion across scanned destination ports.
5. `is_privileged`: Binary flag indicating root, SYSTEM, or Administrator privileges.
6. `is_off_hours`: Temporal anomaly indicator (02:00 - 05:00 UTC activity).

### Layer 3 (Supervised XGBoost Classifier): 8 Features
1. `failed_attempts`: Numeric authentication failure count.
2. `dst_port`: Target destination port (e.g. 22 for SSH, 445 for SMB, 3389 for RDP).
3. `bytes_in`: Normalized inbound payload bytes ($/1000.0$).
4. `bytes_out`: Normalized outbound payload bytes ($/1000.0$).
5. `packet_count`: Total packets recorded in flow.
6. `duration_sec`: Connection duration in seconds.
7. `is_root`: Whether target or source user has administrative rights.
8. `distinct_ports_scanned`: Cardinality of target ports probed in flow window.

---

## 3. Risk Intelligence Calibration & Anti-Double-Counting

Traditional SIEMs frequently generate runaway risk scores by double-counting correlated evidence. AMTIE avoids this using independent signal bounds:

$$\text{Risk Score} = \min\left(100, \text{Rule}_{\text{pts}} + \text{Anomaly}_{\text{pts}} + \text{Classifier}_{\text{pts}} + \text{Correlation}_{\text{bonus}}\right)$$

- **Rule Component ($\text{Rule}_{\text{pts}}$):** Max 35 points (Critical=35, High=28, Medium=18, Low=10).
- **Anomaly Component ($\text{Anomaly}_{\text{pts}}$):** Max 25 points ($25.0 \times \text{deviation}$).
- **Classifier Component ($\text{Classifier}_{\text{pts}}$):** Max 30 points ($30.0 \times \text{confidence} \times \text{weight}_{\text{attack}}$).
- **Correlation Bonus ($\text{Correlation}_{\text{bonus}}$):** Max 15 points (awarded only when multiple distinct kill-chain stages occur across the same entity cluster).

### Severity Thresholds
- **Critical:** $80.0 \le \text{Risk} \le 100.0$ $\rightarrow$ Immediate auto-incident generation & SOC alert.
- **High:** $60.0 \le \text{Risk} < 80.0$ $\rightarrow$ Auto-incident generation, queued for Tier-2 analyst review.
- **Medium:** $35.0 \le \text{Risk} < 60.0$ $\rightarrow$ Logged with detection results, watchlist tagging.
- **Low:** $0.0 \le \text{Risk} < 35.0$ $\rightarrow$ Baseline benign telemetry.
